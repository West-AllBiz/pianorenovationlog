import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import type { Session, User } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getUser: vi.fn(),
  onAuthStateChange: vi.fn(),
  signOut: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  setSession: vi.fn(),
  from: vi.fn(),
  flow: {
    canSend: false,
    pending: vi.fn(),
    send: vi.fn(),
    exchange: vi.fn(),
    cancel: vi.fn(),
  },
}));

vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: mocks, from: mocks.from } }));
vi.mock('@/auth/emailConfig', async original => ({
  ...await original<typeof import('@/auth/emailConfig')>(),
  AUTH_MODE: 'email',
  EMAIL_SEND_ENABLED: false,
}));
vi.mock('@/auth/browserEmailFlow', () => ({ browserEmailFlow: () => mocks.flow }));
// Keep the production routes, layout, Sidebar and EmailLogin. Only unrelated
// dashboard data loading is replaced, so no inventory backend can be accessed.
vi.mock('@/pages/Dashboard', () => ({ default: () => <h1>Verified staff dashboard</h1> }));

import { AppRoutes } from '@/App';
import { AuthProvider } from './useAuth';

const user = {
  id: 'synthetic-email-staff',
  email: 'synthetic-email-staff@example.test',
  email_confirmed_at: '2026-01-01',
  is_anonymous: false,
} as User;
const session = { user, access_token: 'synthetic-email-access' } as Session;
let authEvent: (event: string, session: Session | null) => void;

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

function LocationObserver() {
  return <output data-testid="current-route">{useLocation().pathname}</output>;
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  mocks.getSession.mockResolvedValue({ data: { session }, error: null });
  mocks.getUser.mockResolvedValue({ data: { user }, error: null });
  mocks.onAuthStateChange.mockImplementation(callback => {
    authEvent = callback;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });
  mocks.from.mockImplementation((table: string) => {
    if (table !== 'profiles' && table !== 'user_roles') {
      throw new Error(`Non-auth backend access is forbidden: ${table}`);
    }
    return {
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: table === 'profiles'
              ? { full_name: 'Synthetic Email Staff', email: user.email }
              : { role: 'contributor' },
            error: null,
          }),
        }),
      }),
    };
  });
  mocks.flow.pending.mockReturnValue(null);
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Live network is forbidden in this regression'); }));
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

describe('email-mode Sidebar logout warning through real application routes', () => {
  for (const failure of ['returned error', 'rejected request'] as const) {
    it(`shows the provider warning on fresh EmailLogin after upstream ${failure}, without prior adoption`, async () => {
      const logout = deferred<{ error: Error | null }>();
      mocks.signOut.mockReturnValue(logout.promise);
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      render(
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={['/dashboard']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider><LocationObserver /><AppRoutes /></AuthProvider>
          </MemoryRouter>
        </QueryClientProvider>,
      );

      await screen.findByRole('heading', { name: 'Verified staff dashboard' });
      expect(screen.getByText('Synthetic Email Staff')).toBeVisible();
      expect(mocks.getUser).toHaveBeenCalledWith('synthetic-email-access');
      expect(mocks.from.mock.calls.map(([table]) => table).sort()).toEqual(['profiles', 'user_roles']);
      client.setQueryData(['private-staff-data'], ['SYNTHETIC_PRIVATE_DATA']);

      fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
      expect(mocks.signOut).toHaveBeenCalledTimes(1);
      expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' });
      await screen.findByRole('heading', { name: 'Workshop email sign-in' });
      expect(screen.getByTestId('current-route')).toHaveTextContent('/login');
      expect(screen.queryByRole('heading', { name: 'Verified staff dashboard' })).not.toBeInTheDocument();
      expect(screen.queryByText('Synthetic Email Staff')).not.toBeInTheDocument();
      expect(client.getQueryData(['private-staff-data'])).toBeUndefined();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      // This is a newly mounted email login page, not a callback or a page that
      // ran Continue into Workshop and set its local adopted state.
      expect(screen.getByLabelText('Account email')).toHaveValue('');
      expect(screen.queryByRole('button', { name: 'Sign out and restart' })).not.toBeInTheDocument();

      await act(async () => {
        const error = new Error('PRIVATE_UPSTREAM_LOGOUT_FAILURE');
        if (failure === 'returned error') logout.resolve({ error });
        else logout.reject(error);
      });

      const warning = await screen.findByRole('alert');
      expect(warning).toBeVisible();
      expect(warning).toHaveTextContent('Local Workshop access is blocked in this page');
      expect(warning).toHaveTextContent('server sign-out was not confirmed');
      expect(warning).toHaveTextContent('A stored session may remain after reopening');
      expect(warning).toHaveTextContent('Sign in again deliberately or contact the administrator');
      expect(document.body.textContent).not.toContain('PRIVATE_UPSTREAM_LOGOUT_FAILURE');

      const sessionReads = mocks.getSession.mock.calls.length;
      const identityReads = mocks.getUser.mock.calls.length;
      await act(async () => {
        window.dispatchEvent(new Event('focus'));
        window.dispatchEvent(new Event('pageshow'));
        authEvent('TOKEN_REFRESHED', session);
        authEvent('SIGNED_IN', session);
      });
      expect(screen.getByRole('alert')).toBe(warning);
      expect(screen.getByTestId('current-route')).toHaveTextContent('/login');
      expect(mocks.getSession).toHaveBeenCalledTimes(sessionReads);
      expect(mocks.getUser).toHaveBeenCalledTimes(identityReads);
      expect(mocks.signOut).toHaveBeenCalledTimes(1);
      expect(mocks.setSession).not.toHaveBeenCalled();
      expect(mocks.signInWithPassword).not.toHaveBeenCalled();
      expect(mocks.signUp).not.toHaveBeenCalled();
      expect(mocks.flow.send).not.toHaveBeenCalled();
      expect(mocks.flow.exchange).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
      client.clear();
    });
  }
});
