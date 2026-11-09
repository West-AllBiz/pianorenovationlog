import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ flow: { canSend: true, configured: true, pending: vi.fn(), cancel: vi.fn(), send: vi.fn(), exchange: vi.fn() }, setSession: vi.fn(), signOut: vi.fn(), navigate: vi.fn(), callback: vi.fn(), auth: { user: null as null | { id: string }, loading: false, authError: null as string | null } }));
vi.mock('@/auth/browserEmailFlow', () => ({ browserEmailFlow: () => mocks.flow }));
vi.mock('@/auth/emailCallback', () => ({ takeEmailCallback: mocks.callback }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { setSession: mocks.setSession } } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ ...mocks.auth, signOut: mocks.signOut }) }));
vi.mock('react-router-dom', async original => ({ ...await original<typeof import('react-router-dom')>(), useNavigate: () => mocks.navigate }));
import EmailLogin from './EmailLogin';
const verified = { access_token: 'PRIVATE_ACCESS', refresh_token: 'PRIVATE_REFRESH', userId: 'verified-user' };
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; }
const page = (callback = true) => render(<MemoryRouter><EmailLogin callback={callback} /></MemoryRouter>);
beforeEach(() => {
  vi.clearAllMocks(); mocks.flow.canSend = true; mocks.flow.pending.mockReturnValue(null); mocks.flow.exchange.mockResolvedValue(verified); mocks.flow.send.mockResolvedValue(undefined); mocks.setSession.mockResolvedValue({ error: null }); mocks.signOut.mockResolvedValue(undefined); mocks.callback.mockReturnValue({ kind: 'code', code: 'synthetic-code' }); mocks.auth = { user: null, loading: false, authError: null };
  vi.stubGlobal('fetch', vi.fn(() => { throw Error('Live network forbidden'); }));
});
afterEach(cleanup);
it('verifies callback into memory without automatically adopting or exposing tokens', async () => {
  page(); await screen.findByRole('button', { name: 'Continue into Workshop' }); expect(mocks.setSession).not.toHaveBeenCalled(); expect(document.body.textContent).not.toContain('PRIVATE_'); expect(screen.getByText(/Once selected, sign-in may finish even if you leave/)).toBeInTheDocument();
  expect(screen.getByRole('note')).toHaveTextContent('Email sign-in is available alongside existing staff access.'); expect(screen.getByRole('note')).toHaveTextContent('not a complete security migration'); expect(screen.getByRole('note')).not.toHaveTextContent(/Preparation only|test page/i);
});
it('requires explicit Continue, prevents duplicate commits and waits for the same verified identity', async () => {
  const session = deferred<{ error: null }>(); mocks.setSession.mockReturnValue(session.promise); mocks.auth.user = { id: 'previous-user' }; const view = page();
  const button = await screen.findByRole('button', { name: 'Continue into Workshop' }); fireEvent.click(button); fireEvent.click(button);
  expect(mocks.setSession).toHaveBeenCalledTimes(1); expect(mocks.setSession).toHaveBeenCalledWith({ access_token: verified.access_token, refresh_token: verified.refresh_token });
  await act(async () => session.resolve({ error: null })); expect(mocks.navigate).not.toHaveBeenCalled();
  mocks.auth.user = { id: verified.userId }; view.rerender(<MemoryRouter><EmailLogin callback /></MemoryRouter>);
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/dashboard', { replace: true }));
});
it('cancel before Continue discards verified tokens and never persists a session', async () => {
  page(); await screen.findByRole('button', { name: 'Continue into Workshop' }); fireEvent.click(screen.getByRole('button', { name: 'Cancel pending request' })); expect(mocks.flow.cancel).toHaveBeenCalled(); expect(screen.queryByRole('button', { name: 'Continue into Workshop' })).not.toBeInTheDocument(); expect(mocks.setSession).not.toHaveBeenCalled();
});
it('unmount or pagehide during verification prevents a late session adoption', async () => {
  const pending = deferred<typeof verified>(); mocks.flow.exchange.mockReturnValue(pending.promise); const view = page();
  const signal = mocks.flow.exchange.mock.calls[0][1] as AbortSignal;
  act(() => window.dispatchEvent(new Event('pagehide'))); expect(signal.aborted).toBe(true); expect(screen.getByRole('status')).toHaveTextContent('interrupted before you chose to save it'); view.unmount(); await act(async () => pending.resolve(verified)); expect(mocks.setSession).not.toHaveBeenCalled();
});
it('pagehide before Continue clears memory-only verified tokens', async () => {
  page(); await screen.findByRole('button', { name: 'Continue into Workshop' }); act(() => window.dispatchEvent(new Event('pagehide'))); expect(screen.queryByRole('button', { name: 'Continue into Workshop' })).not.toBeInTheDocument(); expect(mocks.setSession).not.toHaveBeenCalled();
  expect(screen.getByRole('status')).toHaveTextContent('Sign-in was interrupted before you chose to save it. Start a new email sign-in request to continue.'); expect(screen.getByRole('status')).not.toHaveTextContent('Continue to save'); expect(screen.getByRole('link', { name: 'Start a new email sign-in request' })).toBeInTheDocument();
});
it('leaving after explicit commitment may complete without automatic wrong-user logout or redirect', async () => {
  const pending = deferred<{ error: null }>(); mocks.setSession.mockReturnValue(pending.promise); page(); fireEvent.click(await screen.findByRole('button', { name: 'Continue into Workshop' }));
  expect(screen.getByRole('status')).toHaveTextContent(/may complete even if you leave/); act(() => window.dispatchEvent(new Event('pagehide'))); mocks.auth.user = { id: 'newer-unrelated-user' };
  expect(screen.getByRole('status')).toHaveTextContent(/may complete even if you leave/); expect(screen.getByRole('status')).not.toHaveTextContent(/interrupted|cancelled/);
  await act(async () => pending.resolve({ error: null })); expect(mocks.setSession).toHaveBeenCalledTimes(1); expect(mocks.signOut).not.toHaveBeenCalled(); expect(mocks.navigate).not.toHaveBeenCalled(); expect(screen.getByRole('status')).toHaveTextContent(/may complete even if you leave/);
});
it('failed adoption and failed role verification expose an explicit signout/restart path', async () => {
  mocks.setSession.mockResolvedValue({ error: Error('PRIVATE_ERROR') }); page(); fireEvent.click(await screen.findByRole('button', { name: 'Continue into Workshop' }));
  const restart = await screen.findByRole('button', { name: 'Sign out and restart' }); expect(document.body.textContent).not.toContain('PRIVATE_ERROR'); fireEvent.click(restart); await waitFor(() => expect(mocks.signOut).toHaveBeenCalledTimes(1)); expect(mocks.navigate).toHaveBeenCalledWith('/email-login', { replace: true });
});
it('a returning user with a verified existing session can explicitly open that account', async () => {
  mocks.callback.mockReturnValue({ kind: 'none' }); mocks.auth.user = { id: 'current-verified-user' }; page(); fireEvent.click(await screen.findByRole('button', { name: 'Open current signed-in account' })); expect(mocks.navigate).toHaveBeenCalledWith('/dashboard', { replace: true }); expect(mocks.setSession).not.toHaveBeenCalled();
});
it('dormant mode never sends; active mode sends once only after explicit submit', async () => {
  mocks.flow.canSend = false; const view = page(false); const input = screen.getByLabelText('Account email'); fireEvent.change(input, { target: { value: 'staff@example.test' } }); fireEvent.submit(input.closest('form')!); expect(mocks.flow.send).not.toHaveBeenCalled(); view.unmount();
  mocks.flow.canSend = true; const pending = deferred<void>(); mocks.flow.send.mockReturnValue(pending.promise); page(false); const next = screen.getByLabelText('Account email'); fireEvent.change(next, { target: { value: 'staff@example.test' } }); fireEvent.submit(next.closest('form')!); fireEvent.submit(next.closest('form')!); expect(mocks.flow.send).toHaveBeenCalledTimes(1); fireEvent.click(screen.getByRole('button', { name: 'Cancel pending request' })); expect((mocks.flow.send.mock.calls[0][1] as AbortSignal).aborted).toBe(true); await act(async () => pending.resolve()); expect(mocks.flow.send).toHaveBeenCalledTimes(1);
});
it('same already-signed-in identity cannot redirect before a failed commitment is confirmed', async () => {
  const pending = deferred<{ error: Error }>(); mocks.auth.user = { id: verified.userId }; mocks.setSession.mockReturnValue(pending.promise); page(); fireEvent.click(await screen.findByRole('button', { name: 'Continue into Workshop' })); expect(mocks.navigate).not.toHaveBeenCalled(); await act(async () => pending.resolve({ error: Error('PRIVATE') })); expect(mocks.navigate).not.toHaveBeenCalled(); expect(screen.getByRole('button', { name: 'Sign out and restart' })).toBeInTheDocument();
});
