import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('@/auth/emailConfig', () => ({ AUTH_MODE: 'review' }));
vi.mock('@/hooks/useAuth', () => ({ AuthProvider: ({ children }: { children: React.ReactNode }) => children, useAuth: () => ({ user: null, loading: false }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('./pages/Login', () => ({ default: () => <div>LEGACY_NAME_LOGIN</div> }));
vi.mock('./pages/EmailLogin', () => ({ default: ({ callback }: { callback?: boolean }) => <div>{callback ? 'EMAIL_CALLBACK' : 'EXISTING_EMAIL_LOGIN'}</div> }));
vi.mock('./pages/Catalogue', () => ({ default: () => <div>PUBLIC_CATALOGUE</div> }));
vi.mock('./pages/CatalogueDetail', () => ({ default: () => <div>PUBLIC_DETAIL</div> }));
import { AppRoutes } from './App';
afterEach(cleanup);
for (const route of ['/login', '/dashboard']) it('additive review mode preserves legacy sign-in routing for ' + route, () => {
  render(<MemoryRouter initialEntries={[route]}><AppRoutes /></MemoryRouter>); expect(screen.getByText('LEGACY_NAME_LOGIN')).toBeInTheDocument(); expect(screen.queryByText('EXISTING_EMAIL_LOGIN')).not.toBeInTheDocument();
});
for (const route of ['/email-login', '/email-login/callback']) it('additive email route remains separately reachable at ' + route, () => {
  render(<MemoryRouter initialEntries={[route]}><AppRoutes /></MemoryRouter>); expect(screen.getByText(route.endsWith('callback') ? 'EMAIL_CALLBACK' : 'EXISTING_EMAIL_LOGIN')).toBeInTheDocument();
});
for (const route of ['/', '/catalogue', '/catalogue/example']) it('additive mode preserves public catalogue ' + route, () => {
  render(<MemoryRouter initialEntries={[route]}><AppRoutes /></MemoryRouter>); expect(screen.getByText(route.endsWith('example') ? 'PUBLIC_DETAIL' : 'PUBLIC_CATALOGUE')).toBeInTheDocument();
});
