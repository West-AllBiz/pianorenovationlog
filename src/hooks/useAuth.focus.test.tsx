import { useEffect, useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Session, User } from '@supabase/supabase-js';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getSession: vi.fn(), getUser: vi.fn(), onAuthStateChange: vi.fn(), signOut: vi.fn(), signInWithPassword: vi.fn(), signUp: vi.fn(), from: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: mocks, from: mocks.from } }));
vi.mock('@/auth/emailConfig', () => ({ AUTH_MODE: 'review' }));
import { AuthProvider, useAuth } from './useAuth';
import { ProtectedRoute } from '@/App';
import { Sidebar } from '@/components/layout/Sidebar';
import Login from '@/pages/Login';
let latest: ReturnType<typeof useAuth>;
let event: (event: string, session: Session | null) => void;
let mounts = 0; let unmounts = 0;
let currentRole = 'admin'; let currentName = 'Fixture Name';
const user = (id = 'a'): User => ({ id, email: `${id}@example.test`, email_confirmed_at: '2026-01-01', is_anonymous: false }) as User;
const session = (id = 'a'): Session => ({ user: user(id), access_token: `${id}-token` }) as Session;
const answer = (id = 'a') => ({ data: { user: user(id) }, error: null });
function deferred<T>() { let resolve!: (value: T) => void; let reject!: (error: Error) => void; const promise = new Promise<T>((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; }
function StaffForm() {
  const auth = useAuth(); const [draft, setDraft] = useState('');
  useEffect(() => { mounts++; return () => { unmounts++; }; }, []);
  return <><span data-testid="identity">{auth.user?.id}:{auth.role}:{auth.profile?.full_name}</span>{auth.canEdit && <input aria-label="Unsaved staff note" value={draft} onChange={e => setDraft(e.target.value)} />}</>;
}
function Observer() { latest = useAuth(); return null; }
function mount(withSidebar = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/staff']}><AuthProvider><Observer /><Routes><Route path="/staff" element={<ProtectedRoute>{withSidebar && <Sidebar onClose={() => {}} />}<StaffForm /></ProtectedRoute>} /><Route path="/login" element={withSidebar ? <Login /> : <span>Sign in again</span>} /></Routes></AuthProvider></MemoryRouter></QueryClientProvider>);
  return { client, ...view };
}
async function signedIn() { const view = mount(); act(() => event('SIGNED_IN', session())); await screen.findByLabelText('Unsaved staff note'); fireEvent.change(screen.getByLabelText('Unsaved staff note'), { target: { value: 'UNSAVED_SYNTHETIC_NOTE' } }); return view; }
const refresh = async (kind: 'focus' | 'pageshow' = 'focus') => { await act(async () => { window.dispatchEvent(new Event(kind)); }); };
beforeEach(() => {
  vi.clearAllMocks(); mounts = 0; unmounts = 0; currentRole = 'admin'; currentName = 'Fixture Name'; localStorage.clear();
  mocks.getSession.mockResolvedValue({ data: { session: session() }, error: null });
  mocks.getUser.mockImplementation(async (token: string) => answer(token.replace('-token', '')));
  mocks.onAuthStateChange.mockImplementation(cb => { event = cb; return { data: { subscription: { unsubscribe: vi.fn() } } }; });
  mocks.signOut.mockResolvedValue({ error: null });
  mocks.from.mockImplementation((table: string) => ({ select: () => ({ eq: (_: string, id: string) => ({ single: async () => ({ data: table === 'profiles' ? { full_name: currentName, email: `${id}@example.test` } : { role: currentRole }, error: null }) }) }) }));
  vi.stubGlobal('fetch', vi.fn(() => { throw Error('Live network forbidden'); }));
});
afterEach(() => { cleanup(); localStorage.clear(); });
for (const kind of ['focus', 'pageshow'] as const) it(`${kind} pending and success preserve the actual protected form and unsaved state without loading flicker`, async () => {
  const { client } = await signedIn(); const node = screen.getByLabelText('Unsaved staff note'); client.setQueryData(['private'], ['SYNTHETIC']);
  const pending = deferred<ReturnType<typeof answer>>(); mocks.getUser.mockReturnValueOnce(pending.promise);
  await refresh(kind); expect(latest.loading).toBe(false); expect(screen.getByLabelText('Unsaved staff note')).toBe(node); expect(node).toHaveValue('UNSAVED_SYNTHETIC_NOTE'); expect(unmounts).toBe(0); expect(client.getQueryData(['private'])).toEqual(['SYNTHETIC']);
  await act(async () => pending.resolve(answer())); expect(screen.getByLabelText('Unsaved staff note')).toBe(node); expect(node).toHaveValue('UNSAVED_SYNTHETIC_NOTE'); expect(mounts).toBe(1); expect(unmounts).toBe(0);
});
it('TOKEN_REFRESHED for the same verified identity keeps the mounted draft', async () => {
  await signedIn(); const node = screen.getByLabelText('Unsaved staff note'); const pending = deferred<ReturnType<typeof answer>>(); mocks.getUser.mockReturnValueOnce(pending.promise);
  act(() => event('TOKEN_REFRESHED', session())); expect(latest.loading).toBe(false); expect(node).toHaveValue('UNSAVED_SYNTHETIC_NOTE');
  await act(async () => pending.resolve(answer())); expect(screen.getByLabelText('Unsaved staff note')).toBe(node); expect(unmounts).toBe(0);
});
it('a cosmetic profile update refreshes the displayed name without destroying the draft', async () => {
  await signedIn(); const node = screen.getByLabelText('Unsaved staff note'); currentName = 'Updated Fixture'; await refresh();
  expect(screen.getByTestId('identity')).toHaveTextContent('Updated Fixture'); expect(screen.getByLabelText('Unsaved staff note')).toBe(node); expect(node).toHaveValue('UNSAVED_SYNTHETIC_NOTE');
});
it('a verified role downgrade clears private queries and resets all component-local drafts', async () => {
  const { client } = await signedIn(); client.setQueryData(['private'], ['ADMIN_ONLY']); const late = deferred<string[]>(); const work = client.fetchQuery({ queryKey: ['late'], queryFn: () => late.promise }).catch(() => undefined);
  currentRole = 'viewer'; await refresh(); expect(latest.role).toBe('viewer'); expect(latest.isAdmin).toBe(false); expect(latest.canEdit).toBe(false); expect(unmounts).toBe(1); expect(mounts).toBe(2); expect(screen.queryByLabelText('Unsaved staff note')).toBeNull(); expect(client.getQueryData(['private'])).toBeUndefined();
  await act(async () => late.resolve(['STALE_ADMIN'])); await work; expect(client.getQueryData(['late'])).toBeUndefined();
  currentRole = 'admin'; await refresh(); expect(screen.getByLabelText('Unsaved staff note')).toHaveValue(''); expect(unmounts).toBe(2);
});
for (const failure of ['user error', 'profile error', 'missing role', 'invalid role', 'identity mismatch'] as const) it(`${failure} on refresh fails closed and drops cached/private local state`, async () => {
  const { client } = await signedIn(); client.setQueryData(['private'], ['SYNTHETIC']);
  if (failure === 'user error') mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: Error('PRIVATE_DETAIL') });
  if (failure === 'identity mismatch') mocks.getUser.mockResolvedValueOnce(answer('other'));
  if (failure === 'invalid role') currentRole = 'owner';
  if (failure === 'profile error' || failure === 'missing role') {
    const previous = mocks.from.getMockImplementation()!;
    mocks.from.mockImplementation((table: string) => table === (failure === 'profile error' ? 'profiles' : 'user_roles') ? { select: () => ({ eq: () => ({ single: async () => ({ data: null, error: Error('PRIVATE_DETAIL') }) }) }) } : previous(table));
  }
  await refresh(); expect(await screen.findByText('Sign in again')).toBeInTheDocument(); expect(latest.user).toBeNull(); expect(latest.isAdmin).toBe(false); expect(latest.authError).not.toContain('PRIVATE_DETAIL'); expect(client.getQueryData(['private'])).toBeUndefined(); expect(unmounts).toBe(1);
});
it('a different incoming identity clears access/cache before its verification finishes', async () => {
  const { client } = await signedIn(); client.setQueryData(['private'], ['A']); const pending = deferred<ReturnType<typeof answer>>(); mocks.getUser.mockReturnValueOnce(pending.promise);
  act(() => event('SIGNED_IN', session('b'))); expect(latest.user).toBeNull(); expect(latest.loading).toBe(true); expect(unmounts).toBe(1); expect(client.getQueryData(['private'])).toBeUndefined();
  await act(async () => pending.resolve(answer('b'))); expect(screen.getByTestId('identity')).toHaveTextContent('b:admin'); expect(screen.getByLabelText('Unsaved staff note')).toHaveValue('');
});
it('an older same-user success cannot restore privileges after a newer role downgrade', async () => {
  await signedIn(); const old = deferred<ReturnType<typeof answer>>(); mocks.getUser.mockReturnValueOnce(old.promise); await refresh(); currentRole = 'viewer'; act(() => event('TOKEN_REFRESHED', session())); await waitFor(() => expect(latest.role).toBe('viewer')); currentRole = 'admin'; await act(async () => old.resolve(answer())); expect(latest.role).toBe('viewer'); expect(screen.queryByLabelText('Unsaved staff note')).toBeNull();
});
it('an older same-user failure cannot erase a newer successful auth event', async () => {
  await signedIn(); const node = screen.getByLabelText('Unsaved staff note'); const old = deferred<ReturnType<typeof answer>>(); mocks.getUser.mockReturnValueOnce(old.promise); await refresh(); act(() => event('TOKEN_REFRESHED', session())); await waitFor(() => expect(mocks.getUser).toHaveBeenCalledTimes(3)); await act(async () => old.reject(Error('PRIVATE_OLD'))); expect(latest.user?.id).toBe('a'); expect(latest.authError).toBeNull(); expect(screen.getByLabelText('Unsaved staff note')).toBe(node);
});
it('a delayed session lookup cannot override a newer identity event', async () => {
  await signedIn(); const lookup = deferred<{ data: { session: Session }; error: null }>(); mocks.getSession.mockReturnValueOnce(lookup.promise); await refresh(); act(() => event('SIGNED_IN', session('b'))); await waitFor(() => expect(latest.user?.id).toBe('b')); await act(async () => lookup.resolve({ data: { session: session() }, error: null })); expect(latest.user?.id).toBe('b');
});
it('logout interrupts pending validation and late success cannot resurrect the protected form', async () => {
  const { client } = await signedIn(); const old = deferred<ReturnType<typeof answer>>(); mocks.getUser.mockReturnValueOnce(old.promise); await refresh(); client.setQueryData(['private'], ['SYNTHETIC']); await act(async () => latest.signOut()); expect(latest.user).toBeNull(); expect(client.getQueryData(['private'])).toBeUndefined(); await act(async () => old.resolve(answer())); expect(latest.user).toBeNull(); expect(screen.getByText('Sign in again')).toBeInTheDocument();
});
it('failed logout blocks focus, pageshow, late token and initial-session events, and provider remount', async () => {
  const view = await signedIn(); mocks.signOut.mockResolvedValue({ error: Error('PRIVATE_REMOTE_FAILURE') }); await act(async () => { await expect(latest.signOut()).rejects.toThrow('server sign-out'); }); expect(latest.authError).toMatch(/server sign-out/); expect(latest.authError).not.toContain('PRIVATE');
  const count = mocks.getUser.mock.calls.length; await refresh(); await refresh('pageshow'); act(() => { event('TOKEN_REFRESHED', session()); event('INITIAL_SESSION', session()); event('SIGNED_IN', session()); }); expect(latest.user).toBeNull(); expect(mocks.getUser).toHaveBeenCalledTimes(count); expect(latest.authError).toMatch(/server sign-out/);
  view.unmount(); mount(); await act(async () => {}); expect(latest.user).toBeNull(); expect(latest.loading).toBe(false); expect(mocks.getUser).toHaveBeenCalledTimes(count);
});
it('duplicate signout shares one SDK request and failed deliberate login keeps the old session blocked', async () => {
  await signedIn(); const pending = deferred<{ error: Error }>(); mocks.signOut.mockReturnValueOnce(pending.promise); let first!: Promise<void>; let second!: Promise<void>; act(() => { first = latest.signOut(); second = latest.signOut(); }); expect(first).toBe(second); expect(mocks.signOut).toHaveBeenCalledTimes(1); const settled = Promise.allSettled([first, second]); await act(async () => pending.resolve({ error: Error('PRIVATE') })); await settled;
  mocks.signInWithPassword.mockResolvedValue({ data: { session: null }, error: Error('WRONG_PASSWORD') }); await act(async () => { expect((await latest.signIn('a@example.test', 'synthetic')).error).not.toBeNull(); }); await refresh(); act(() => event('SIGNED_IN', session())); expect(latest.user).toBeNull();
});
it('only a successful deliberate sign-in releases the logout latch and verifies that new session', async () => {
  await signedIn(); await act(async () => latest.signOut()); mocks.signInWithPassword.mockImplementation(async () => { event('SIGNED_IN', session('b')); return { data: { session: session('b') }, error: null }; }); await act(async () => { expect((await latest.signIn('b@example.test', 'synthetic')).error).toBeNull(); }); expect(latest.user?.id).toBe('b'); expect(latest.isAdmin).toBe(true);
});
it('late explicit sign-in completion after logout never releases the logout latch', async () => {
  await signedIn(); const pending = deferred<{ data: { session: Session }; error: null }>(); mocks.signInWithPassword.mockReturnValueOnce(pending.promise); let login!: Promise<unknown>; act(() => { login = latest.signIn('b@example.test', 'synthetic'); }); await act(async () => latest.signOut()); await act(async () => pending.resolve({ data: { session: session('b') }, error: null })); await login; await refresh(); expect(latest.user).toBeNull();
});
it('external SIGNED_OUT during explicit login invalidates its late completion', async () => {
  await signedIn(); const pending = deferred<{ data: { session: Session }; error: null }>(); mocks.signInWithPassword.mockReturnValueOnce(pending.promise); let login!: Promise<{ error: Error | null }>; act(() => { login = latest.signIn('b@example.test', 'synthetic'); }); act(() => event('SIGNED_OUT', null)); await act(async () => pending.resolve({ data: { session: session('b') }, error: null })); expect((await login).error).not.toBeNull(); await refresh(); act(() => event('TOKEN_REFRESHED', session('b'))); expect(latest.user).toBeNull();
});
it('external SIGNED_OUT during a pending refresh unmounts immediately and rejects the late result', async () => {
  await signedIn(); const pending = deferred<ReturnType<typeof answer>>(); mocks.getUser.mockReturnValueOnce(pending.promise); await refresh(); act(() => event('SIGNED_OUT', null)); expect(latest.user).toBeNull(); expect(unmounts).toBe(1); await act(async () => pending.resolve(answer())); expect(latest.user).toBeNull();
});
it('the actual sidebar shows verified profile/email/role and its failed signout message survives navigation to actual login', async () => {
  currentRole = 'contributor'; currentName = 'Synthetic Staff'; mount(true); act(() => event('SIGNED_IN', session())); await screen.findByLabelText('Unsaved staff note'); expect(screen.getByText('Synthetic Staff')).toBeInTheDocument(); expect(screen.getByText('a@example.test')).toBeInTheDocument(); expect(screen.getByText('contributor')).toBeInTheDocument(); expect(screen.queryByText('Nick West')).toBeNull(); expect(screen.queryByText('Admin')).toBeNull();
  mocks.signOut.mockResolvedValueOnce({ error: Error('PRIVATE_SERVER_DETAIL') }); fireEvent.click(screen.getByRole('button', { name: 'Sign out' })); expect(await screen.findByRole('alert')).toHaveTextContent('server sign-out was not confirmed'); expect(screen.getByRole('alert')).not.toHaveTextContent('PRIVATE_SERVER_DETAIL'); expect(screen.queryByLabelText('Unsaved staff note')).toBeNull(); expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' });
});
it('explicit email adoption is single-flight and requires provider verification before reopening access', async () => {
  await signedIn(); await act(async () => latest.signOut()); const adopted = deferred<{ data: { session: Session }; error: null }>(); const setSession = vi.fn(() => adopted.promise); Object.assign(mocks, { setSession });
  let first!: Promise<{ error: Error | null }>; act(() => { first = latest.saveEmailSession({ access_token: 'SYNTHETIC', refresh_token: 'SYNTHETIC_REFRESH' }); });
  await act(async () => { expect((await latest.saveEmailSession({ access_token: 'SYNTHETIC', refresh_token: 'SYNTHETIC_REFRESH' })).error).not.toBeNull(); }); expect(setSession).toHaveBeenCalledTimes(1); expect(latest.user).toBeNull(); await act(async () => adopted.resolve({ data: { session: session('b') }, error: null })); expect((await first).error).toBeNull(); expect(latest.user?.id).toBe('b');
});
it('failed identity verification after explicit adoption leaves the retained SDK session blocked', async () => {
  await signedIn(); await act(async () => latest.signOut()); Object.assign(mocks, { setSession: vi.fn().mockResolvedValue({ data: { session: session('b') }, error: null }) }); mocks.getUser.mockResolvedValue({ data: { user: null }, error: Error('REVOKED') }); await act(async () => { expect((await latest.saveEmailSession({ access_token: 'SYNTHETIC', refresh_token: 'SYNTHETIC_REFRESH' })).error).not.toBeNull(); }); mocks.getUser.mockResolvedValue(answer('b')); await refresh(); act(() => event('INITIAL_SESSION', session('b'))); expect(latest.user).toBeNull();
});
it('a different SIGNED_IN during explicit provider verification cannot publish the old account against the new SDK identity', async () => {
  await signedIn(); await act(async () => latest.signOut()); const verification = deferred<ReturnType<typeof answer>>(); mocks.getUser.mockReturnValueOnce(verification.promise); Object.assign(mocks, { setSession: vi.fn().mockResolvedValue({ data: { session: session('a') }, error: null }) });
  let adoption!: Promise<{ error: Error | null }>; act(() => { adoption = latest.saveEmailSession({ access_token: 'SYNTHETIC', refresh_token: 'SYNTHETIC_REFRESH' }); }); await waitFor(() => expect(mocks.getUser).toHaveBeenCalledTimes(2)); act(() => event('SIGNED_IN', session('b'))); const readCount = mocks.from.mock.calls.length; await act(async () => verification.resolve(answer('a'))); expect(mocks.from).toHaveBeenCalledTimes(readCount); expect((await adoption).error).not.toBeNull(); expect(latest.user).toBeNull(); await refresh(); expect(latest.user).toBeNull();
});
it('a different account event before the SDK result also prevents adoption of a mismatched result', async () => {
  await signedIn(); const pending = deferred<{ data: { session: Session }; error: null }>(); mocks.signInWithPassword.mockReturnValueOnce(pending.promise); let work!: Promise<{ error: Error | null }>; act(() => { work = latest.signIn('a@example.test', 'synthetic'); }); act(() => event('SIGNED_IN', session('b'))); await act(async () => pending.resolve({ data: { session: session('a') }, error: null })); expect((await work).error).not.toBeNull(); expect(latest.user).toBeNull();
});
it('a matching SDK event and token refresh during explicit verification do not cancel the deliberate sign-in', async () => {
  await signedIn(); await act(async () => latest.signOut()); const verification = deferred<ReturnType<typeof answer>>(); mocks.getUser.mockReturnValueOnce(verification.promise); mocks.signInWithPassword.mockImplementation(async () => { event('SIGNED_IN', session('b')); return { data: { session: session('b') }, error: null }; }); let work!: Promise<{ error: Error | null }>; act(() => { work = latest.signIn('b@example.test', 'synthetic'); }); await waitFor(() => expect(mocks.getUser).toHaveBeenCalledTimes(2)); act(() => event('TOKEN_REFRESHED', session('b'))); await act(async () => verification.resolve(answer('b'))); expect((await work).error).toBeNull(); expect(latest.user?.id).toBe('b');
});
