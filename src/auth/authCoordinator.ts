import type { Session, User } from '@supabase/supabase-js';
export type AppRole = 'admin' | 'contributor' | 'viewer';
export type AuthState = { user: User | null; profile: { full_name: string; email: string } | null; role: AppRole; loading: boolean; authError: string | null };
export const emptyAuth = (loading = false, authError: string | null = null): AuthState => ({ user: null, profile: null, role: 'viewer', loading, authError });
export function createAuthCoordinator(options: { load: (session: Session) => Promise<AuthState>; publish: (state: AuthState) => void; clearCache: () => void }) {
  let version = 0;
  let stopped = false;
  let identity: string | null = null;
  let acceptedRole: AppRole | null = null;
  function clear() {
    version++;
    identity = null;
    acceptedRole = null;
    options.clearCache();
    if (!stopped) options.publish(emptyAuth());
  }
  async function update(session: Session | null) {
    if (stopped) return;
    const ownVersion = ++version;
    const nextIdentity = session?.user.id ?? null;
    if (identity !== nextIdentity) { options.clearCache(); acceptedRole = null; }
    identity = nextIdentity;
    options.publish(emptyAuth(!!session));
    if (!session) return;
    try {
      // Do not call Supabase inside onAuthStateChange's lock-held callback.
      const state = await Promise.resolve().then(() => options.load(session));
      if (stopped || ownVersion !== version) return;
      if (state.user?.id !== nextIdentity) throw new Error('Identity changed.');
      if (acceptedRole !== null && acceptedRole !== state.role) options.clearCache();
      acceptedRole = state.role;
      options.publish(state);
    } catch {
      if (stopped || ownVersion !== version) return;
      acceptedRole = null;
      options.clearCache();
      options.publish(emptyAuth(false, 'Workshop access could not be verified. Sign out and try again, or contact the administrator.'));
    }
  }
  return { update, clear, version: () => version, stop: () => { stopped = true; version++; } };
}
