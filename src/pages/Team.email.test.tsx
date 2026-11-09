import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
const auth = vi.hoisted(() => ({ user: { email: 'current@example.test' }, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => auth }));
vi.mock('@/auth/emailConfig', () => ({ AUTH_MODE: 'email' }));
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ isLoading: false, data: [{ id: 'a', name: 'Other Staff', email: 'other@example.test', role: 'viewer' }] }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
import Team from './Team';
afterEach(cleanup);
it('replacement mode offers no predictable-credential account switching path', () => {
  render(<MemoryRouter><Team /></MemoryRouter>); expect(screen.queryByText('Switch')).not.toBeInTheDocument(); expect(screen.getByText(/Name-based account switching is disabled/)).toBeInTheDocument(); expect(auth.signIn).not.toHaveBeenCalled(); expect(auth.signUp).not.toHaveBeenCalled(); expect(auth.signOut).not.toHaveBeenCalled();
});
