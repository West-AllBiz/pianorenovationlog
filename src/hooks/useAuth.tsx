import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';
import { AUTH_MODE } from '@/auth/emailConfig';
import { createAuthCoordinator, emptyAuth, type AuthState, type AppRole } from '@/auth/authCoordinator';

type AuthResult = { error: Error | null };
interface AuthContextType extends AuthState {
  canEdit: boolean; isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, fullName: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>(() => emptyAuth(true));
  const coordinator = useRef<ReturnType<typeof createAuthCoordinator> | null>(null);
  const signingOut = useRef(false);
  useEffect(() => {
    const current = createAuthCoordinator({
      publish: setState,
      clearCache: () => { void queryClient.cancelQueries(); queryClient.clear(); },
      load: async (session: Session): Promise<AuthState> => {
        const { data: { user }, error } = await supabase.auth.getUser(session.access_token);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!signingOut.current || !session) void current.update(session);
    });
    const refresh = () => {
      const version = current.version();
      void supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (current.version() === version && !signingOut.current) void current.update(error ? null : session);
      }).catch(() => { if (current.version() === version) current.clear(); });
    };
    // Recheck the actual SDK session after a committed sign-in finishes while away.
    if (current.version() === initialVersion) refresh();
    window.addEventListener('pageshow', refresh);
    window.addEventListener('focus', refresh);
    return () => { current.stop(); subscription.unsubscribe(); window.removeEventListener('pageshow', refresh); window.removeEventListener('focus', refresh); if (coordinator.current === current) coordinator.current = null; };
  }, [queryClient]);
  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    if (AUTH_MODE === 'email') return { error: new Error('Use the existing-account email sign-in page.') };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };
  const signUp = async (email: string, password: string, fullName: string): Promise<AuthResult> => {
    if (AUTH_MODE === 'email') return { error: new Error('Account creation is not available from Workshop sign-in.') };
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin } });
    return { error };
  };
  const signOut = async () => {
    signingOut.current = true;
    coordinator.current?.clear();
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw new Error('Local Workshop access was cleared, but server sign-out was not confirmed.');
    } finally { signingOut.current = false; }
  };
  return <AuthContext.Provider value={{ ...state, canEdit: !!state.user && !state.loading && (state.role === 'admin' || state.role === 'contributor'), isAdmin: !!state.user && !state.loading && state.role === 'admin', signIn, signUp, signOut }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
