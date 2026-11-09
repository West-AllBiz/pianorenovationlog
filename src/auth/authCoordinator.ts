import type { Session, User } from '@supabase/supabase-js';
export type AppRole = 'admin' | 'contributor' | 'viewer';
export type AuthState = { user: User | null; profile: { full_name: string; email: string } | null; role: AppRole; loading: boolean; authError: string | null };
export const emptyAuth = (loading = false, authError: string | null = null): AuthState => ({ user: null, profile: null, role: 'viewer', loading, authError });
export function createAuthCoordinator(options: { load: (session: Session, isCurrent: () => boolean) => Promise<AuthState>; publish: (state: AuthState) => void; clearCache: () => void }) {
  let version = 0;
  let stopped = false;
  let identity: string | null = null;
  let accepted: AuthState | null = null;
  function clear(authError: string | null = null) {
    version++;
    identity = null;
    accepted = null;
    options.clearCache();
    if (!stopped) options.publish(emptyAuth(false, authError));
  }
  async function update(session: Session | null) {
    if (stopped) return;
    const ownVersion = ++version;
    const nextIdentity = session?.user.id ?? null;
    if (identity !== nextIdentity) { options.clearCache(); accepted = null; }
    identity = nextIdentity;
    // Only retain a previously verified identity. A routine refresh must not tear
    // down the protected subtree (or its unsaved drafts) while verification runs.
    if (!accepted || accepted.user?.id !== nextIdentity) options.publish(emptyAuth(!!session));
    if (!session) return;
    try {
      // Do not call Supabase inside onAuthStateChange's lock-held callback.
      const isCurrent = () => !stopped && ownVersion === version;
      const state = await Promise.resolve().then(() => {
        if (!isCurrent()) throw new Error('Superseded verification.');
        return options.load(session, isCurrent);
      });
      if (stopped || ownVersion !== version) return;
      if (state.user?.id !== nextIdentity) throw new Error('Identity changed.');
      if (accepted && accepted.role !== state.role) options.clearCache();
      accepted = state;
      options.publish(state);
      return true;
    } catch {
      if (stopped || ownVersion !== version) return;
      accepted = null;
      options.clearCache();
      options.publish(emptyAuth(false, 'Workshop access could not be verified. Sign out and try again, or contact the administrator.'));
    }
  }
  return { update, clear, version: () => version, stop: () => { stopped = true; version++; } };
}
