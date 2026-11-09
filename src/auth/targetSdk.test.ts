import { createClient } from '@supabase/supabase-js';
import { expect, it, vi } from 'vitest';
import { captureEmailCallback } from './emailCallback';
import { SOURCE_URL } from './emailConfig';
const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
const id = '00000000-0000-4000-8000-000000000001';
const access = encode({ alg: 'HS256', typ: 'JWT' }) + '.' + encode({ sub: id, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000), role: 'authenticated' }) + '.synthetic-signature';
const user = { id, email: 'sdk-test@example.test', aud: 'authenticated', created_at: '2026-01-01T00:00:00Z', app_metadata: {}, user_metadata: {}, email_confirmed_at: '2026-01-01T00:00:00Z' };
function setup() {
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
  const fetch = vi.fn<typeof globalThis.fetch>(async (url, init) => {
    const target = new URL(String(url));
    if (target.pathname === '/auth/v1/user') return new Response(JSON.stringify(user), { status: 200, headers: { 'Content-Type': 'application/json' } });
    if (target.pathname === '/auth/v1/logout' && target.searchParams.get('scope') === 'local' && init?.method === 'POST') return new Response(null, { status: 204 });
    throw new Error('Unexpected or live SDK request forbidden');
  });
  const client = createClient(SOURCE_URL, 'sb_publishable_synthetic_sdk_test', { auth: { storage, persistSession: true, autoRefreshToken: false, detectSessionInUrl: true }, global: { fetch } });
  return { client, fetch, values };
}
it('target SDK explicitly adopts a verified session through supplied storage and signs out locally', async () => {
  const f = setup(); await f.client.auth.getSession(); const events: string[] = [];
  const { data: { subscription } } = f.client.auth.onAuthStateChange(event => { events.push(event); });
  const adopted = await f.client.auth.setSession({ access_token: access, refresh_token: 'synthetic-sdk-refresh' });
  expect(adopted.error).toBeNull(); expect(adopted.data.user?.id).toBe(id); expect([...f.values.values()].some(value => value.includes('synthetic-sdk-refresh'))).toBe(true); expect(events).toContain('SIGNED_IN');
  expect((await f.client.auth.getSession()).data.session?.user.id).toBe(id);
  expect((await f.client.auth.signOut({ scope: 'local' })).error).toBeNull(); expect(events).toContain('SIGNED_OUT'); expect([...f.values.values()].some(value => value.includes('synthetic-sdk-refresh'))).toBe(false);
  expect(f.fetch.mock.calls.every(([url]) => ['/auth/v1/user', '/auth/v1/logout'].includes(new URL(String(url)).pathname))).toBe(true);
  const logout = f.fetch.mock.calls.find(([url]) => String(url).includes('/logout'))!; expect(new Headers(logout[1]?.headers).get('Authorization')).toBe('Bearer ' + access); subscription.unsubscribe(); f.client.auth.stopAutoRefresh();
});
it('cleaned callback cannot be auto-consumed by the unchanged SDK URL detector', async () => {
  window.history.replaceState(null, '', '/email-login/callback?code=synthetic-code-123');
  expect(captureEmailCallback(window.location, window.history).kind).toBe('code'); expect(window.location.search).toBe('');
  const f = setup(); await f.client.auth.getSession(); expect(f.fetch).not.toHaveBeenCalled(); expect(f.values.size).toBe(0); f.client.auth.stopAutoRefresh(); window.history.replaceState(null, '', '/');
});
it('new email entry strips implicit tokens before the unchanged SDK can adopt them', async () => {
  window.history.replaceState(null, '', '/email-login#access_token=' + access + '&refresh_token=synthetic-sdk-refresh&expires_in=3600&token_type=bearer');
  expect(captureEmailCallback(window.location, window.history).kind).toBe('none'); expect(window.location.hash).toBe('');
  const f = setup(); await f.client.auth.getSession(); expect(f.fetch).not.toHaveBeenCalled(); expect(f.values.size).toBe(0); f.client.auth.stopAutoRefresh(); window.history.replaceState(null, '', '/');
});
it('control: default SDK can adopt implicit tokens on a route variant if bootstrap cleanup is omitted', async () => {
  window.history.replaceState(null, '', '/EMAIL-LOGIN/#access_token=' + access + '&refresh_token=synthetic-sdk-refresh&expires_in=3600&token_type=bearer');
  const f = setup(); expect((await f.client.auth.getSession()).data.session?.user.id).toBe(id); expect(f.fetch).toHaveBeenCalled(); expect([...f.values.values()].some(value => value.includes('synthetic-sdk-refresh'))).toBe(true);
  await f.client.auth.signOut({ scope: 'local' }); f.client.auth.stopAutoRefresh(); window.history.replaceState(null, '', '/');
});
it('Router-matched route variants are cleaned before the SDK and cannot auto-adopt URL tokens', async () => {
  for (const pathname of ['/email-login/', '/EMAIL-LOGIN', '/%65mail-login', '/email-login/callback/', '/EMAIL-LOGIN/CALLBACK', '/email-login/%63allback']) {
    window.history.replaceState(null, '', pathname + '#access_token=' + access + '&refresh_token=synthetic-sdk-refresh&expires_in=3600&token_type=bearer');
    captureEmailCallback(window.location, window.history); expect(window.location.hash).toBe('');
    const f = setup(); expect((await f.client.auth.getSession()).data.session).toBeNull(); expect(f.fetch).not.toHaveBeenCalled(); expect(f.values.size).toBe(0); f.client.auth.stopAutoRefresh();
  }
  window.history.replaceState(null, '', '/');
});
