import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';
import { createLocalAccessGate, LOCAL_SIGNOUT_KEY } from '@/auth/localAccessGate';
import { AUTH_MODE } from '@/auth/emailConfig';
import { createAuthCoordinator, emptyAuth, type AuthState, type AppRole } from '@/auth/authCoordinator';

type AuthResult = { error: Error | null };
interface AuthContextType extends AuthState {
  canEdit: boolean; isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, fullName: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  saveEmailSession: (tokens: { access_token: string; refresh_token: string }) => Promise<AuthResult>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>(() => emptyAuth(true));
  const coordinator = useRef<ReturnType<typeof createAuthCoordinator> | null>(null);
  const signingOut = useRef(false);
  const explicitPending = useRef(false);
  const explicitIdentity = useRef<string | null>(null);
  const intent = useRef(0);
  const logoutWork = useRef<Promise<void> | null>(null);
  const [accessGate] = useState(() => createLocalAccessGate());
  useEffect(() => {
    const current = createAuthCoordinator({
      publish: setState,
      clearCache: () => { void queryClient.cancelQueries(); queryClient.clear(); },
      load: async (session: Session, isCurrent): Promise<AuthState> => {
        const { data: { user }, error } = await supabase.auth.getUser(session.access_token);
        if (!isCurrent()) throw new Error('Superseded verification.');
        if (error || !user || user.id !== session.user.id || user.is_anonymous) throw new Error('Identity not verified.');
        if (AUTH_MODE === 'email' && (!user.email_confirmed_at || !user.email || /\.local$/i.test(user.email))) throw new Error('Real confirmed email required.');
        const [profileResult, roleResult] = await Promise.all([
          supabase.from('profiles').select('full_name, email').eq('id', user.id).single(),
          supabase.from('user_roles').select('role').eq('user_id', user.id).single(),
        ]);
        if (profileResult.error || !profileResult.data || roleResult.error || !roleResult.data || !['admin', 'contributor', 'viewer'].includes(roleResult.data.role)) throw new Error('Access not verified.');
        return { user, profile: profileResult.data, role: roleResult.data.role as AppRole, loading: false, authError: null };
      },
    });
    coordinator.current = current;
    const initialVersion = current.version();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' && !session) {
        if (!signingOut.current) { intent.current++; explicitPending.current = false; accessGate.block(); }
        current.clear();
        return;
      }
      if (explicitPending.current && session) {
        // An SDK operation emits its own SIGNED_IN before resolving. Fence any
        // later account replacement instead of verifying A against B's SDK client.
        if (explicitIdentity.current !== null && explicitIdentity.current !== session.user.id) {
          intent.current++; explicitPending.current = false; accessGate.block(); current.clear();
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') explicitIdentity.current = session.user.id;
        return;
      }
      if (!signingOut.current && !explicitPending.current && !accessGate.blocked()) void current.update(session);
    });
    const refresh = () => {
      if (signingOut.current || explicitPending.current || accessGate.blocked()) return;
      const version = current.version();
      void supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (current.version() === version && !signingOut.current && !explicitPending.current && !accessGate.blocked()) void current.update(error ? null : session);
      }).catch(() => { if (current.version() === version) current.clear(); });
    };
    // Recheck the actual SDK session after a committed sign-in finishes while away.
    if (accessGate.blocked()) current.clear();
    else if (current.version() === initialVersion) refresh();
    const storageChanged = (event: StorageEvent) => { if (event.key === LOCAL_SIGNOUT_KEY && event.newValue !== null) { intent.current++; explicitPending.current = false; accessGate.block(); current.clear(); } };
    window.addEventListener('storage', storageChanged);
    window.addEventListener('pageshow', refresh);
    window.addEventListener('focus', refresh);
    return () => { current.stop(); subscription.unsubscribe(); window.removeEventListener('storage', storageChanged); window.removeEventListener('pageshow', refresh); window.removeEventListener('focus', refresh); if (coordinator.current === current) coordinator.current = null; };
  }, [queryClient, accessGate]);
  const explicitSignIn = async (operation: () => Promise<{ data?: { session: Session | null }; error: Error | null }>, requireSession = true): Promise<AuthResult> => {
    if (signingOut.current || explicitPending.current) return { error: new Error('An account action is already in progress.') };
    const ownIntent = ++intent.current;
    explicitPending.current = true;
    explicitIdentity.current = null;
    // Any failure must not fall back to the previous SDK session.
    accessGate.block();
    coordinator.current?.clear();
    try {
      const result = await operation();
      if (ownIntent !== intent.current) throw new Error('A newer account action superseded this sign-in.');
      if (result.error) throw result.error;
      if (requireSession && !result.data?.session) throw new Error('No session returned.');
      // A signup awaiting confirmation grants no session and does not unlock access.
      if (result.data?.session) {
        if (explicitIdentity.current !== null && explicitIdentity.current !== result.data.session.user.id) throw new Error('Session changed during sign-in.');
        explicitIdentity.current = result.data.session.user.id;
        accessGate.allowExplicitSignIn();
        const verified = await coordinator.current?.update(result.data.session);
        if (ownIntent !== intent.current) throw new Error('A newer account action superseded this sign-in.');
        if (!verified) { accessGate.block(); throw new Error('Access not verified.'); }
      }
      return { error: null };
    } catch {
      return { error: new Error('Sign-in could not be confirmed. Please try again deliberately.') };
    } finally { if (ownIntent === intent.current) explicitPending.current = false; }
  };
  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    if (AUTH_MODE === 'email') return { error: new Error('Use the existing-account email sign-in page.') };
    return explicitSignIn(() => supabase.auth.signInWithPassword({ email, password }));
  };
  const signUp = async (email: string, password: string, fullName: string): Promise<AuthResult> => {
    if (AUTH_MODE === 'email') return { error: new Error('Account creation is not available from Workshop sign-in.') };
    return explicitSignIn(() => supabase.auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin } }), false);
  };
  const saveEmailSession = (tokens: { access_token: string; refresh_token: string }) => explicitSignIn(() => supabase.auth.setSession(tokens));
  const signOut = (): Promise<void> => {
    if (logoutWork.current) return logoutWork.current;
    const ownIntent = ++intent.current;
    explicitPending.current = false;
    signingOut.current = true;
    accessGate.block();
    coordinator.current?.clear();
    const work = (async () => {
      try {
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        if (error) throw error;
      } catch {
        const message = 'Local Workshop access is blocked in this page, but server sign-out was not confirmed. A stored session may remain after reopening. Sign in again deliberately or contact the administrator.';
        if (ownIntent === intent.current) coordinator.current?.clear(message);
        throw new Error(message);
      } finally { signingOut.current = false; logoutWork.current = null; }
    })();
    logoutWork.current = work;
    return work;
  };
  return <AuthContext.Provider value={{ ...state, canEdit: !!state.user && !state.loading && (state.role === 'admin' || state.role === 'contributor'), isAdmin: !!state.user && !state.loading && state.role === 'admin', signIn, signUp, signOut, saveEmailSession }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
