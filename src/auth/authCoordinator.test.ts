import { expect, it, vi } from 'vitest';
import type { Session, User } from '@supabase/supabase-js';
import { createAuthCoordinator, emptyAuth, type AuthState, type AppRole } from './authCoordinator';
const session = (id: string) => ({ user: { id }, access_token: 'synthetic-' + id }) as Session;
const ready = (id: string, role: AppRole = 'admin'): AuthState => ({ user: { id } as User, profile: { full_name: id, email: id + '@example.test' }, role, loading: false, authError: null });
function deferred<T>() { let resolve!: (value: T) => void; let reject!: (error: Error) => void; const promise = new Promise<T>((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; }
it('clears previous identity, role/profile and cache immediately and holds loading until full verification', async () => {
  const next = deferred<AuthState>(); const publish = vi.fn(); const clearCache = vi.fn(); const load = vi.fn().mockResolvedValueOnce(ready('a')).mockReturnValueOnce(next.promise);
  const c = createAuthCoordinator({ load, publish, clearCache }); await c.update(session('a'));
  const work = c.update(session('b')); expect(publish).toHaveBeenLastCalledWith(emptyAuth(true)); expect(clearCache).toHaveBeenCalledTimes(2);
  next.resolve(ready('b', 'viewer')); await work; expect(publish).toHaveBeenLastCalledWith(ready('b', 'viewer'));
});
it('late previous-user success cannot restore old privileges after a new user', async () => {
  const old = deferred<AuthState>(); const publish = vi.fn(); const c = createAuthCoordinator({ load: vi.fn().mockReturnValueOnce(old.promise).mockResolvedValueOnce(ready('b', 'viewer')), publish, clearCache: vi.fn() });
  const first = c.update(session('a')); await Promise.resolve(); await c.update(session('b')); old.resolve(ready('a')); await first;
  expect(publish).toHaveBeenLastCalledWith(ready('b', 'viewer')); expect(publish.mock.calls.some(([s]) => s.user?.id === 'a')).toBe(false);
});
it('late failure cannot erase a newer verified user', async () => {
  const old = deferred<AuthState>(); const publish = vi.fn(); const c = createAuthCoordinator({ load: vi.fn().mockReturnValueOnce(old.promise).mockResolvedValueOnce(ready('b')), publish, clearCache: vi.fn() });
  const first = c.update(session('a')); await Promise.resolve(); await c.update(session('b')); old.reject(new Error('PRIVATE')); await first; expect(publish).toHaveBeenLastCalledWith(ready('b'));
});
it('signout clears cache and rejects an in-flight old profile', async () => {
  const old = deferred<AuthState>(); const publish = vi.fn(); const clearCache = vi.fn(); const c = createAuthCoordinator({ load: () => old.promise, publish, clearCache });
  const work = c.update(session('a')); c.clear(); old.resolve(ready('a')); await work; expect(publish).toHaveBeenLastCalledWith(emptyAuth()); expect(clearCache).toHaveBeenCalledTimes(2);
});
it('query/identity failure leaves no user or stale role and clears cached data', async () => {
  const publish = vi.fn(); const clearCache = vi.fn(); const c = createAuthCoordinator({ load: vi.fn().mockResolvedValueOnce(ready('a')).mockRejectedValueOnce(new Error('PRIVATE_DATABASE')), publish, clearCache });
  await c.update(session('a')); await c.update(session('a')); const last = publish.mock.calls.at(-1)![0]; expect(last).toMatchObject({ user: null, profile: null, role: 'viewer', loading: false }); expect(last.authError).not.toContain('PRIVATE'); expect(clearCache).toHaveBeenCalledTimes(2);
});
it('same-user role change clears caches and rejects mismatched resolved identity', async () => {
  const publish = vi.fn(); const clearCache = vi.fn(); const c = createAuthCoordinator({ load: vi.fn().mockResolvedValueOnce(ready('a')).mockResolvedValueOnce(ready('a', 'viewer')).mockResolvedValueOnce(ready('other')), publish, clearCache });
  await c.update(session('a')); await c.update(session('a')); expect(clearCache).toHaveBeenCalledTimes(2); await c.update(session('a')); expect(publish.mock.calls.at(-1)![0].user).toBeNull();
});
it('unmounted provider ignores outstanding requests', async () => {
  const old = deferred<AuthState>(); const publish = vi.fn(); const c = createAuthCoordinator({ load: () => old.promise, publish, clearCache: vi.fn() }); const work = c.update(session('a')); c.stop(); old.resolve(ready('a')); await work; expect(publish).toHaveBeenCalledTimes(1);
});
