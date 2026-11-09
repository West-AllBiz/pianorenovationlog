import { AUTH_MODE, EMAIL_SEND_ENABLED } from './emailConfig';
import { createEmailFlow } from './emailFlow';
export function browserEmailFlow() {
  return createEmailFlow({ mode: AUTH_MODE, sendEnabled: EMAIL_SEND_ENABLED, origin: window.location.origin, sourceUrl: import.meta.env.VITE_SUPABASE_URL ?? '', publicKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '', storage: window.sessionStorage, crypto: window.crypto, fetch: window.fetch.bind(window) });
}
