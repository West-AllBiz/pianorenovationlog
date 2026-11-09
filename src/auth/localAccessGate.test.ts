import { expect, it, vi } from 'vitest';
import { createLocalAccessGate, LOCAL_SIGNOUT_KEY } from './localAccessGate';
function fake() { const values = new Map<string, string>(); return { getItem: vi.fn((key: string) => values.get(key) ?? null), setItem: vi.fn((key: string, value: string) => { values.set(key, value); }), removeItem: vi.fn((key: string) => { values.delete(key); }) }; }
it('persists only a non-secret intent marker and blocks a new document until deliberate allowance', () => {
  const storage = fake(); const first = createLocalAccessGate(() => storage, { blocked: false }); expect(first.blocked()).toBe(false); first.block(); expect(storage.setItem).toHaveBeenCalledWith(LOCAL_SIGNOUT_KEY, '1');
  const reloaded = createLocalAccessGate(() => storage, { blocked: false }); expect(reloaded.blocked()).toBe(true); reloaded.allowExplicitSignIn(); expect(reloaded.blocked()).toBe(false);
});
it('storage read failure fails closed, and explicit allowance cannot claim success', () => {
  const storage = fake(); storage.getItem.mockImplementation(() => { throw Error('READ_DENIED'); }); const gate = createLocalAccessGate(() => storage, { blocked: false }); expect(gate.blocked()).toBe(true); expect(() => gate.allowExplicitSignIn()).toThrow();
});
it('storage remove failure does not release a prior logout latch', () => {
  const storage = fake(); const gate = createLocalAccessGate(() => storage, { blocked: false }); gate.block(); storage.removeItem.mockImplementation(() => { throw Error('WRITE_DENIED'); }); expect(() => gate.allowExplicitSignIn()).toThrow(); expect(gate.blocked()).toBe(true);
});
it('silent ignored storage removal still fails closed', () => {
  const storage = fake(); const gate = createLocalAccessGate(() => storage, { blocked: false }); gate.block(); storage.removeItem.mockImplementation(() => {}); expect(() => gate.allowExplicitSignIn()).toThrow(); expect(gate.blocked()).toBe(true);
});
it('quota failure blocks this document/remount but cannot promise persistence after a fresh document with readable empty storage', () => {
  const storage = fake(); storage.setItem.mockImplementation(() => { throw Error('QUOTA'); }); const memory = { blocked: false }; const gate = createLocalAccessGate(() => storage, memory); gate.block(); expect(gate.blocked()).toBe(true); expect(createLocalAccessGate(() => storage, memory).blocked()).toBe(true);
  // Explicit limitation: if the SDK session remains and no marker can be written,
  // a new JS document cannot recover an intent that was only held in memory.
  expect(createLocalAccessGate(() => storage, { blocked: false }).blocked()).toBe(false);
});
it('a silently ignored marker write retains the in-document fallback', () => {
  const storage = fake(); storage.setItem.mockImplementation(() => {}); const gate = createLocalAccessGate(() => storage, { blocked: false }); gate.block(); expect(gate.blocked()).toBe(true);
});
