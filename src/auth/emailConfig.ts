export type AuthMode = 'legacy' | 'review' | 'email';
export const CANONICAL_ORIGIN = 'https://nworkshop.nickspianoservices.com';
export const SOURCE_URL = 'https://bxurezzzvdnuiiwtaqxw.supabase.co';
export const EMAIL_CALLBACK_PATH = '/email-login/callback';
export const EMAIL_CALLBACK_URL = CANONICAL_ORIGIN + EMAIL_CALLBACK_PATH;
export function resolveAuthMode(value: unknown): AuthMode {
  return value === 'review' || value === 'email' ? value : 'legacy';
}
export const AUTH_MODE = resolveAuthMode(import.meta.env.VITE_WORKSHOP_AUTH_MODE);
// A rollout switch, not a server authorization boundary. Off in every default build.
export const EMAIL_SEND_ENABLED = import.meta.env.VITE_WORKSHOP_EMAIL_SEND_ENABLED === 'true';
