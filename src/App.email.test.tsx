import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('@/auth/emailConfig', () => ({ AUTH_MODE: 'email' }));
vi.mock('@/hooks/useAuth', () => ({ AuthProvider: ({ children }: { children: React.ReactNode }) => children, useAuth: () => ({ user: null, loading: false }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('./pages/Login', () => ({ default: () => <div>LEGACY_NAME_LOGIN</div> }));
vi.mock('./pages/EmailLogin', () => ({ default: () => <div>EXISTING_EMAIL_LOGIN</div> }));
vi.mock('./pages/Catalogue', () => ({ default: () => <div>PUBLIC_CATALOGUE</div> }));
vi.mock('./pages/CatalogueDetail', () => ({ default: () => <div>PUBLIC_DETAIL</div> }));
import { AppRoutes } from './App';
afterEach(cleanup);
for (const route of ['/login', '/email-login', '/email-login/callback', '/dashboard']) it('replacement routing excludes legacy login for ' + route, () => {
  render(<MemoryRouter initialEntries={[route]}><AppRoutes /></MemoryRouter>); expect(screen.getByText('EXISTING_EMAIL_LOGIN')).toBeInTheDocument(); expect(screen.queryByText('LEGACY_NAME_LOGIN')).not.toBeInTheDocument();
});
for (const route of ['/', '/catalogue', '/catalogue/example']) it('preserves anonymous catalogue route ' + route, () => {
  render(<MemoryRouter initialEntries={[route]}><AppRoutes /></MemoryRouter>); expect(screen.getByText(route.endsWith('example') ? 'PUBLIC_DETAIL' : 'PUBLIC_CATALOGUE')).toBeInTheDocument();
});
