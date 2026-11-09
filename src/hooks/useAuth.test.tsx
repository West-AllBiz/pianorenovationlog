import { act, cleanup, render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Session, User } from '@supabase/supabase-js';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getSession: vi.fn(), getUser: vi.fn(), onAuthStateChange: vi.fn(), signOut: vi.fn(), signInWithPassword: vi.fn(), signUp: vi.fn(), from: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: mocks, from: mocks.from } }));
vi.mock('@/auth/emailConfig', () => ({ AUTH_MODE: 'email' }));
import { AuthProvider, useAuth } from './useAuth';
let latest: ReturnType<typeof useAuth>;
let event: (_event: string, session: Session | null) => void;
const user = (id: string): User => ({ id, email: id + '@example.test', email_confirmed_at: '2026-01-01', is_anonymous: false }) as User;
const session = (id: string): Session => ({ user: user(id), access_token: id + '-token' }) as Session;
const empty = { data: { session: null }, error: null };
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; }
function Harness() { latest = useAuth(); return <span>{latest.user?.id ?? 'none'}:{latest.role}:{String(latest.loading)}</span>; }
function mount() { const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); render(<QueryClientProvider client={client}><AuthProvider><Harness /></AuthProvider></QueryClientProvider>); return client; }
beforeEach(() => {
  vi.clearAllMocks(); mocks.getSession.mockResolvedValue(empty); mocks.getUser.mockImplementation(async token => ({ data: { user: user(String(token).replace('-token', '')) }, error: null })); mocks.signOut.mockResolvedValue({ error: null });
  mocks.onAuthStateChange.mockImplementation(callback => { event = callback; return { data: { subscription: { unsubscribe: vi.fn() } } }; });
  mocks.from.mockImplementation(table => ({ select: () => ({ eq: (_field: string, id: string) => ({ single: async () => ({ data: table === 'profiles' ? { full_name: id, email: id + '@example.test' } : { role: 'admin' }, error: null }) }) }) }));
  vi.stubGlobal('fetch', vi.fn(() => { throw Error('No live network'); }));
});
afterEach(cleanup);
it('initial stale getSession cannot override a newer auth event', async () => {
  const initial = deferred<typeof empty>(); mocks.getSession.mockReturnValue(initial.promise); mount(); act(() => event('SIGNED_IN', session('new'))); await waitFor(() => expect(latest.user?.id).toBe('new'));
  await act(async () => initial.resolve({ data: { session: session('old') }, error: null } as typeof empty)); expect(latest.user?.id).toBe('new'); expect(mocks.getUser).not.toHaveBeenCalledWith('old-token');
});
it('role/profile resolution holds loading and does not expose user or admin rights early', async () => {
  const role = deferred<{ data: { role: string }; error: null }>(); const original = mocks.from.getMockImplementation()!;
  mocks.from.mockImplementation(table => table !== 'user_roles' ? original(table) : ({ select: () => ({ eq: () => ({ single: () => role.promise }) }) }));
  mount(); act(() => event('SIGNED_IN', session('a'))); await waitFor(() => expect(mocks.from).toHaveBeenCalledWith('user_roles')); expect(latest.loading).toBe(true); expect(latest.user).toBeNull(); expect(latest.isAdmin).toBe(false);
  await act(async () => role.resolve({ data: { role: 'viewer' }, error: null })); await waitFor(() => expect(latest.loading).toBe(false)); expect(latest.role).toBe('viewer'); expect(latest.canEdit).toBe(false);
});
it('identity transition cancels and clears unscoped cache; a late old query cannot repopulate it', async () => {
  const client = mount(); act(() => event('SIGNED_IN', session('a'))); await waitFor(() => expect(latest.user?.id).toBe('a'));
  client.setQueryData(['team_members'], ['PRIVATE_A']); const request = deferred<string[]>(); const oldQuery = client.fetchQuery({ queryKey: ['old-private'], queryFn: () => request.promise }).catch(() => undefined);
  act(() => event('SIGNED_IN', session('b'))); expect(client.getQueryData(['team_members'])).toBeUndefined(); expect(latest.user).toBeNull();
  await act(async () => request.resolve(['PRIVATE_LATE_A'])); await oldQuery; await waitFor(() => expect(latest.user?.id).toBe('b')); expect(client.getQueryData(['old-private'])).toBeUndefined();
});
it('replacement mode blocks password and signup methods before any SDK call', async () => {
  mount(); await waitFor(() => expect(latest.loading).toBe(false)); expect((await latest.signIn('a@piano.local', 'synthetic')).error).not.toBeNull(); expect((await latest.signUp('a@piano.local', 'synthetic', 'a')).error).not.toBeNull(); expect(mocks.signInWithPassword).not.toHaveBeenCalled(); expect(mocks.signUp).not.toHaveBeenCalled();
});
it('replacement mode rejects synthetic unconfirmed or anonymous identities', async () => {
  for (const patch of [{ email: 'a@piano.local' }, { email_confirmed_at: null }, { is_anonymous: true }]) {
    mocks.getUser.mockResolvedValue({ data: { user: { ...user('a'), ...patch } }, error: null }); const view = mount(); act(() => event('SIGNED_IN', session('a'))); await waitFor(() => expect(latest.authError).not.toBeNull()); expect(latest.user).toBeNull(); expect(latest.isAdmin).toBe(false); cleanup(); view.clear();
  }
});
it('signout immediately clears UI/cache and ignores refresh events until local signout settles', async () => {
  const pending = deferred<{ error: null }>(); mocks.signOut.mockReturnValue(pending.promise); const client = mount(); act(() => event('SIGNED_IN', session('a'))); await waitFor(() => expect(latest.user?.id).toBe('a')); client.setQueryData(['team_members'], ['PRIVATE_A']);
  let work!: Promise<void>; act(() => { work = latest.signOut(); }); expect(latest.user).toBeNull(); expect(client.getQueryData(['team_members'])).toBeUndefined(); act(() => event('TOKEN_REFRESHED', session('a'))); await act(async () => pending.resolve({ error: null })); await work; expect(latest.user).toBeNull(); expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' });
});
