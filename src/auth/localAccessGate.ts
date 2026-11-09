// A non-secret, origin-local intent marker, separate from all SDK/broker tokens.
// It prevents a retained SDK session from silently reopening Workshop after logout.
export const LOCAL_SIGNOUT_KEY = 'workshop-local-signout-v1';
const pageFallback = { blocked: false };
export function createLocalAccessGate(
  storage: () => Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = () => window.localStorage,
  memory = pageFallback,
) {
  return {
    blocked() {
      try { return memory.blocked || storage().getItem(LOCAL_SIGNOUT_KEY) !== null; }
      catch { return true; } // Unreadable storage never restores passive access.
    },
    block() {
      memory.blocked = true;
      try { const target = storage(); target.setItem(LOCAL_SIGNOUT_KEY, '1'); memory.blocked = target.getItem(LOCAL_SIGNOUT_KEY) !== '1'; } catch { /* This document still stays blocked. */ }
    },
    allowExplicitSignIn() {
      // Only call after a successful, deliberate new sign-in, never an SDK event.
      const target = storage();
      target.removeItem(LOCAL_SIGNOUT_KEY);
      if (target.getItem(LOCAL_SIGNOUT_KEY) !== null) throw new Error('Local sign-in could not be confirmed.');
      memory.blocked = false;
    },
  };
}
