import { webcrypto } from 'node:crypto';
import { TextEncoder } from 'node:util';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmailFlow, FLOW_KEY, FLOW_TTL_MS, type EmailFlowOptions } from './emailFlow';
import { CANONICAL_ORIGIN, EMAIL_CALLBACK_URL, SOURCE_URL } from './emailConfig';
const NOW = 1794186000000;
const EMAIL = 'staff@example.test';
const ID = 'synthetic-user';
const token = { access_token: 'synthetic-access', refresh_token: 'PRIVATE_REFRESH' };
const user = { id: ID, email: EMAIL, email_confirmed_at: '2026-11-09T00:00:00Z', is_anonymous: false };
const result = (data: unknown, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data }) as Response;
function fixture(overrides: Partial<EmailFlowOptions> = {}) {
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
  const fetch = vi.fn<typeof globalThis.fetch>();
  const options: EmailFlowOptions = { mode: 'review', sendEnabled: true, origin: CANONICAL_ORIGIN, sourceUrl: SOURCE_URL, publicKey: 'sb_publishable_synthetic', storage, crypto: webcrypto as Crypto, fetch, now: () => NOW, ...overrides };
  const flow = createEmailFlow(options);
  const seed = (patch: object = {}) => storage.setItem(FLOW_KEY, JSON.stringify({ verifier: 'a'.repeat(43), email: EMAIL, created: NOW, ...patch }));
  return { flow, fetch, storage, seed, values };
}
beforeEach(() => { vi.stubGlobal('TextEncoder', TextEncoder); vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Live network forbidden in tests'); })); });
for (const override of [{ mode: 'legacy' as const }, { sendEnabled: false }, { origin: 'https://evil.example' }, { sourceUrl: 'https://other.supabase.co' }, { publicKey: 'sb_secret_not_allowed' }]) it('fails closed without sending for ' + JSON.stringify(override), async () => {
  const f = fixture(override); await expect(f.flow.send(EMAIL)).rejects.toThrow(); expect(f.fetch).not.toHaveBeenCalled();
});
it('builds source-pinned existing-account S256 request and stores only verifier/email/time', async () => {
  const f = fixture(); f.fetch.mockResolvedValue(result({})); await f.flow.send(' STAFF@example.test ');
  expect(f.fetch).toHaveBeenCalledTimes(1);
  const [url, init] = f.fetch.mock.calls[0]; const target = new URL(String(url));
  expect(target.origin).toBe(SOURCE_URL); expect(target.pathname).toBe('/auth/v1/otp'); expect([...target.searchParams]).toEqual([['redirect_to', EMAIL_CALLBACK_URL]]);
  expect(init).toMatchObject({ method: 'POST', redirect: 'error', credentials: 'omit', referrerPolicy: 'no-referrer' });
  const body = JSON.parse(String(init?.body)); expect(body).toEqual({ email: EMAIL, create_user: false, code_challenge: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/), code_challenge_method: 's256' });
  expect(Object.keys(JSON.parse(f.storage.getItem(FLOW_KEY)!)).sort()).toEqual(['created', 'email', 'verifier']);
});
for (const email of ['', 'a@piano.local', 'name', 'a@x', 'a\n@example.test', 'a'.repeat(255) + '@example.test']) it('rejects invalid/synthetic email ' + email.slice(0, 20), async () => {
  const f = fixture(); await expect(f.flow.send(email)).rejects.toThrow(); expect(f.fetch).not.toHaveBeenCalled();
});
it('rejects duplicate send including while cryptographic work is pending', async () => {
  const f = fixture(); f.fetch.mockResolvedValue(result({})); const first = f.flow.send(EMAIL);
  await expect(f.flow.send(EMAIL)).rejects.toThrow(/pending/); await first;
  await expect(f.flow.send(EMAIL)).rejects.toThrow(/pending/); expect(f.fetch).toHaveBeenCalledTimes(1);
});
for (const status of [400, 422, 429, 500]) it('retains pending state without retry or private errors on ' + status, async () => {
  const f = fixture(); f.fetch.mockResolvedValue(result({ message: 'PRIVATE_PROVIDER_ERROR' }, status));
  await expect(f.flow.send(EMAIL)).rejects.toThrow(/not confirmed/); expect(f.fetch).toHaveBeenCalledTimes(1); expect(f.flow.pending()).not.toBeNull();
});
it('retains verifier on uncertain network failure and cancellation removes it', async () => {
  const f = fixture(); f.fetch.mockRejectedValue(new Error('PRIVATE_NETWORK')); await expect(f.flow.send(EMAIL)).rejects.not.toThrow(/PRIVATE/);
  expect(f.flow.pending()).not.toBeNull(); f.flow.cancel(); expect(f.flow.pending()).toBeNull(); expect(f.fetch).toHaveBeenCalledTimes(1);
});
for (const patch of [{ created: NOW + 1 }, { created: NOW - FLOW_TTL_MS - 1 }, { created: 'bad' }, { verifier: 'bad' }, { email: 'x@piano.local' }]) it('rejects malformed expired/future tab state ' + JSON.stringify(patch), async () => {
  const f = fixture(); f.seed(patch); await expect(f.flow.exchange('valid-code-123')).rejects.toThrow(); expect(f.fetch).not.toHaveBeenCalled(); expect(f.values.size).toBe(0);
});
it('lost-tab or cancelled flow cannot exchange a code', async () => {
  const f = fixture(); await expect(f.flow.exchange('valid-code-123')).rejects.toThrow(/this tab/); expect(f.fetch).not.toHaveBeenCalled();
});
it('reload in the same tab retains verifier; exchange consumes it before calls and verifies same email and role', async () => {
  const f = fixture(); f.seed(); f.fetch.mockImplementation(async (_url, _init) => { expect(f.values.size).toBe(0); return [result(token), result(user), result([{ user_id: ID, role: 'admin' }])][f.fetch.mock.calls.length - 1]; });
  await expect(f.flow.exchange('valid-code-123')).resolves.toEqual({ ...token, userId: ID });
  expect(JSON.parse(String(f.fetch.mock.calls[0][1]?.body))).toEqual({ auth_code: 'valid-code-123', code_verifier: 'a'.repeat(43) });
  expect(f.fetch.mock.calls[0][0]).toBe(SOURCE_URL + '/auth/v1/token?grant_type=pkce');
  expect(f.fetch.mock.calls[1][0]).toBe(SOURCE_URL + '/auth/v1/user'); expect(f.fetch.mock.calls[1][1]?.headers).toMatchObject({ Authorization: 'Bearer synthetic-access' });
  expect(new URL(String(f.fetch.mock.calls[2][0])).searchParams.get('user_id')).toBe('eq.' + ID);
  await expect(f.flow.exchange('valid-code-123')).rejects.toThrow(); expect(f.fetch).toHaveBeenCalledTimes(3);
});
for (const patch of [{ email: 'other@example.test' }, { email_confirmed_at: null }, { is_anonymous: true }, { banned_until: '2099-01-01T00:00:00Z' }, { id: null }]) it('rejects identity mismatch or ineligible user ' + JSON.stringify(patch), async () => {
  const f = fixture(); f.seed(); f.fetch.mockResolvedValueOnce(result(token)).mockResolvedValueOnce(result({ ...user, ...patch }));
  await expect(f.flow.exchange('valid-code-123')).rejects.not.toThrow(/PRIVATE/); expect(f.fetch).toHaveBeenCalledTimes(2); expect(f.values.size).toBe(0);
});
for (const roles of [[], [{ user_id: ID, role: 'owner' }], [{ user_id: 'different-user', role: 'admin' }], [{ user_id: ID, role: 'admin' }, { user_id: ID, role: 'viewer' }]]) it('rejects missing malformed or ambiguous authoritative role ' + JSON.stringify(roles), async () => {
  const f = fixture(); f.seed(); f.fetch.mockResolvedValueOnce(result(token)).mockResolvedValueOnce(result({ ...user, user_metadata: { role: 'admin' } })).mockResolvedValueOnce(result(roles));
  await expect(f.flow.exchange('valid-code-123')).rejects.toThrow(/could not be verified/); expect(f.values.size).toBe(0);
});
it('aborted exchange never releases tokens even when a mock completes late', async () => {
  const controller = new AbortController(); const f = fixture(); f.seed(); f.fetch.mockImplementation(async () => { controller.abort(); return result(token); });
  await expect(f.flow.exchange('valid-code-123', controller.signal)).rejects.toThrow(); expect(f.fetch).toHaveBeenCalledTimes(1);
});
it('no credential or route-bearing caller options are accepted by the send API', async () => {
  const f = fixture(); f.fetch.mockResolvedValue(result({})); await f.flow.send(EMAIL);
  const body = JSON.parse(String(f.fetch.mock.calls[0][1]?.body)); expect(body.password).toBeUndefined(); expect(body.type).toBeUndefined(); expect(body.redirect_to).toBeUndefined();
});
