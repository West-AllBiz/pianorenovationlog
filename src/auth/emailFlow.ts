import { CANONICAL_ORIGIN, EMAIL_CALLBACK_URL, SOURCE_URL, type AuthMode } from './emailConfig';
export const FLOW_KEY = 'workshop-email-pkce-v1';
export const FLOW_TTL_MS = 15 * 60 * 1000;
type Pending = { verifier: string; email: string; created: number };
type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type SessionTokens = { access_token: string; refresh_token: string; userId: string };
export interface EmailFlowOptions {
  mode: AuthMode; sendEnabled: boolean; origin: string; sourceUrl: string; publicKey: string;
  storage: StorageLike; crypto: Crypto; fetch: typeof fetch; now?: () => number;
}
const validEmail = (email: string) => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !/\.local$/i.test(email);
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const safe = (message: string) => new Error(message);
function validPublicKey(key: string): boolean {
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return true;
  try {
    const parts = key.split('.');
    if (parts.length !== 3 || key.length > 8192) return false;
    const claim = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return claim.role === 'anon' && claim.ref === 'bxurezzzvdnuiiwtaqxw';
  } catch { return false; }
}
const base64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export function createEmailFlow(options: EmailFlowOptions) {
  const now = options.now ?? Date.now;
  let sending = false;
  const configured = options.mode !== 'legacy' && options.origin === CANONICAL_ORIGIN && options.sourceUrl === SOURCE_URL && validPublicKey(options.publicKey);
  function pending(): Pending | null {
    try {
      const raw = options.storage.getItem(FLOW_KEY);
      if (!raw) return null;
      if (raw.length > 1024) throw safe('Invalid pending request.');
      const value: unknown = JSON.parse(raw);
      if (!record(value) || typeof value.verifier !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(value.verifier) || typeof value.email !== 'string' || !validEmail(value.email) || !Number.isSafeInteger(value.created) || Number(value.created) > now() || now() - Number(value.created) > FLOW_TTL_MS) throw safe('Invalid pending request.');
      return value as Pending;
    } catch {
      try { options.storage.removeItem(FLOW_KEY); } catch { /* Fail closed if tab storage is blocked. */ }
      return null;
    }
  }
  function cancel() { options.storage.removeItem(FLOW_KEY); }
  async function request(path: string, init: RequestInit, signal?: AbortSignal, readJson = false) {
    if (signal?.aborted) throw safe('Sign-in was cancelled.');
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(abort, 15000);
    try {
      const response = await options.fetch(SOURCE_URL + path, { ...init, redirect: 'error', cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', signal: controller.signal, headers: { apikey: options.publicKey, 'Content-Type': 'application/json', 'X-Supabase-Api-Version': '2024-01-01', ...init.headers } });
      const data: unknown = readJson && response.ok ? await response.json() : null;
      if (controller.signal.aborted) throw safe('Sign-in was cancelled.');
      return { ok: response.ok, data };
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  }
  async function send(emailInput: string, signal?: AbortSignal): Promise<void> {
    if (!configured || !options.sendEnabled) throw safe('Email sign-in is disabled pending rollout approval.');
    const email = emailInput.trim().toLowerCase();
    if (!validEmail(email)) throw safe('Enter the real email address for an existing Workshop account.');
    if (sending || pending()) throw safe('A request is already pending in this tab. Open that link or cancel it before starting another.');
    sending = true;
    try {
      const verifier = base64url(options.crypto.getRandomValues(new Uint8Array(32)));
      const digest = await options.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
      if (signal?.aborted) throw safe('Sign-in was cancelled.');
      // Save before the request: a timeout cannot tell us whether mail was sent.
      options.storage.setItem(FLOW_KEY, JSON.stringify({ verifier, email, created: now() }));
      const response = await request('/auth/v1/otp?' + new URLSearchParams({ redirect_to: EMAIL_CALLBACK_URL }), { method: 'POST', body: JSON.stringify({ email, create_user: false, code_challenge: base64url(new Uint8Array(digest)), code_challenge_method: 's256' }) }, signal);
      if (!response.ok) throw safe('The email request was not confirmed. No automatic retry was made.');
    } catch {
      throw safe('The email request was not confirmed. It may still arrive. No automatic retry was made.');
    } finally { sending = false; }
  }
  async function exchange(code: string, signal?: AbortSignal): Promise<SessionTokens> {
    if (!configured) throw safe('Email sign-in is not configured for this origin.');
    const flow = pending();
    cancel(); // Consume the local verifier before exchange, including failures.
    if (!flow || !/^[A-Za-z0-9._~-]{8,512}$/.test(code)) throw safe('This link cannot be used in this tab. Start a new approved sign-in request.');
    try {
      const response = await request('/auth/v1/token?grant_type=pkce', { method: 'POST', body: JSON.stringify({ auth_code: code, code_verifier: flow.verifier }) }, signal, true);
      if (!response.ok) throw safe('Invalid link.');
      const tokens: unknown = response.data;
      if (!record(tokens) || typeof tokens.access_token !== 'string' || !tokens.access_token || tokens.access_token.length > 8192 || typeof tokens.refresh_token !== 'string' || !tokens.refresh_token || tokens.refresh_token.length > 8192) throw safe('Invalid session.');
      const headers = { Authorization: `Bearer ${tokens.access_token}` };
      const userResponse = await request('/auth/v1/user', { method: 'GET', headers }, signal, true);
      if (!userResponse.ok) throw safe('Invalid account.');
      const user: unknown = userResponse.data;
      if (!record(user) || typeof user.id !== 'string' || typeof user.email !== 'string' || user.email.toLowerCase() !== flow.email || !user.email_confirmed_at || user.is_anonymous === true || (typeof user.banned_until === 'string' && Date.parse(user.banned_until) > now())) throw safe('Invalid account.');
      const query = new URLSearchParams({ select: 'user_id,role', user_id: `eq.${user.id}`, limit: '2' });
      const roleResponse = await request('/rest/v1/user_roles?' + query, { method: 'GET', headers }, signal, true);
      if (!roleResponse.ok) throw safe('Access not verified.');
      const roles: unknown = roleResponse.data;
      if (!Array.isArray(roles) || roles.length !== 1 || !record(roles[0]) || roles[0].user_id !== user.id || !['admin', 'contributor', 'viewer'].includes(String(roles[0].role))) throw safe('Access not verified.');
      if (signal?.aborted) throw safe('Sign-in was cancelled.');
      return { access_token: tokens.access_token, refresh_token: tokens.refresh_token, userId: user.id };
    } catch { throw safe('The link or existing account access could not be verified. Request a new link only when ready to try again.'); }
  }
  return { configured, canSend: configured && options.sendEnabled, pending, cancel, send, exchange };
}
