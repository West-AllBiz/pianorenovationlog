import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Session, User } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getUser: vi.fn(),
  onAuthStateChange: vi.fn(),
  signOut: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  from: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  upsert: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: mocks, from: mocks.from } }));
vi.mock('@/auth/emailConfig', () => ({ AUTH_MODE: 'review' }));

import { ProtectedRoute } from '@/App';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { AddPianoDialog } from './AddPianoDialog';

const user = {
  id: 'synthetic-staff',
  email: 'synthetic-staff@example.test',
  email_confirmed_at: '2026-01-01',
  is_anonymous: false,
} as User;
const session = { user, access_token: 'synthetic-token' } as Session;
const sessionResult = () => ({ data: { session }, error: null });
const userResult = () => ({ data: { user }, error: null });

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

function StaffAddPiano() {
  const { canEdit } = useAuth();
  const [open, setOpen] = useState(false);
  return <>
    {canEdit && <button onClick={() => setOpen(true)}>Add workshop item</button>}
    <AddPianoDialog open={open} onOpenChange={setOpen} />
  </>;
}

function mountStaffForm() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/staff']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            <Route path="/staff" element={<ProtectedRoute><StaffAddPiano /></ProtectedRoute>} />
            <Route path="/login" element={<span>Sign in again</span>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return client;
}

// These production labels currently have no htmlFor; locate their sibling inputs
// without replacing the real dialog or relying on the order of its fields.
function field(dialog: HTMLElement, label: string) {
  const input = within(dialog).getByText(label, { selector: 'label' }).parentElement?.querySelector('input');
  if (!input) throw new Error(`Missing production dialog field: ${label}`);
  return input;
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mocks.getSession.mockResolvedValue(sessionResult());
  mocks.getUser.mockResolvedValue(userResult());
  mocks.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
  mocks.from.mockImplementation((table: string) => {
    if (table !== 'profiles' && table !== 'user_roles') {
      throw new Error(`Unexpected non-auth backend access: ${table}`);
    }
    return {
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: table === 'profiles'
              ? { full_name: 'Synthetic Staff', email: user.email }
              : { role: 'contributor' },
            error: null,
          }),
        }),
      }),
      insert: mocks.insert,
      update: mocks.update,
      upsert: mocks.upsert,
      delete: mocks.delete,
    };
  });
  for (const write of [mocks.insert, mocks.update, mocks.upsert, mocks.delete]) {
    write.mockImplementation(() => { throw new Error('Backend writes are forbidden in this regression'); });
  }
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Live network is forbidden in this regression'); }));
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('real staff AddPianoDialog draft preservation', () => {
  for (const eventName of ['focus', 'pageshow'] as const) {
    it(`keeps the open dialog and all draft fields through pending and successful ${eventName} revalidation, without saving`, async () => {
      const client = mountStaffForm();
      fireEvent.click(await screen.findByRole('button', { name: 'Add workshop item' }));
      const dialog = screen.getByRole('dialog', { name: 'Add Workshop Item — Identification' });
      const values = [
        ['Brand / Make *', 'Synthetic Baldwin'],
        ['Model', 'UNSAVED-MODEL'],
        ['Serial Number', 'UNSAVED-SERIAL-123'],
        ['Estimated Year', 'c. 1920'],
        ['Country', 'Synthetic country'],
        ['Finish', 'UNSAVED walnut'],
      ] as const;
      const draftInputs = values.map(([label, value]) => {
        const input = field(dialog, label);
        fireEvent.change(input, { target: { value } });
        return { label, input, value };
      });
      const bench = within(dialog).getByRole('switch');
      fireEvent.click(bench);

      const expectDraftIntact = () => {
        expect(screen.getByRole('dialog', { name: 'Add Workshop Item — Identification' })).toBe(dialog);
        expect(dialog).toBeVisible();
        expect(within(dialog).getByText('Step 1 of 5')).toBeVisible();
        for (const { label, input, value } of draftInputs) {
          expect(field(dialog, label)).toBe(input);
          expect(input).toHaveValue(value);
        }
        expect(within(dialog).getByRole('switch')).toBe(bench);
        expect(bench).toHaveAttribute('aria-checked', 'true');
        expect(screen.queryByText('Sign in again')).not.toBeInTheDocument();
      };
      expectDraftIntact();

      const pendingSession = deferred<ReturnType<typeof sessionResult>>();
      const pendingUser = deferred<ReturnType<typeof userResult>>();
      const sessionCalls = mocks.getSession.mock.calls.length;
      const userCalls = mocks.getUser.mock.calls.length;
      const authReads = mocks.from.mock.calls.length;
      mocks.getSession.mockReturnValueOnce(pendingSession.promise);
      mocks.getUser.mockReturnValueOnce(pendingUser.promise);

      await act(async () => { window.dispatchEvent(new Event(eventName)); });
      expect(mocks.getSession).toHaveBeenCalledTimes(sessionCalls + 1);
      expect(mocks.getUser).toHaveBeenCalledTimes(userCalls);
      expectDraftIntact();

      await act(async () => { pendingSession.resolve(sessionResult()); });
      expect(mocks.getUser).toHaveBeenCalledTimes(userCalls + 1);
      expect(mocks.getUser).toHaveBeenLastCalledWith('synthetic-token');
      expectDraftIntact();

      await act(async () => { pendingUser.resolve(userResult()); });
      await waitFor(() => expect(mocks.from).toHaveBeenCalledTimes(authReads + 2));
      expectDraftIntact();
      expect(mocks.from.mock.calls.every(([table]) => table === 'profiles' || table === 'user_roles')).toBe(true);
      for (const write of [mocks.insert, mocks.update, mocks.upsert, mocks.delete]) expect(write).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
      client.clear();
    });
  }
});
