import { describe, expect, it, vi } from 'vitest';
import { captureEmailCallback, takeEmailCallback } from './emailCallback';
import { EMAIL_CALLBACK_PATH, resolveAuthMode } from './emailConfig';
it('cleans valid code synchronously and allows one read only', () => {
  const history = { replaceState: vi.fn() };
  expect(captureEmailCallback({ pathname: EMAIL_CALLBACK_PATH, search: '?code=synthetic-code-123', hash: '' }, history)).toEqual({ kind: 'code', code: 'synthetic-code-123' });
  expect(history.replaceState).toHaveBeenCalledWith(null, '', EMAIL_CALLBACK_PATH);
  expect(takeEmailCallback().kind).toBe('code'); expect(takeEmailCallback().kind).toBe('none');
});
for (const [search, hash] of [['?code=short', ''], ['?code=valid-code&next=https://evil.example', ''], ['?code=valid-code&code=other-code', ''], ['', '#access_token=secret'], ['?error_description=PRIVATE_MESSAGE', '']]) it('rejects and strips unsupported callback ' + search, () => {
  const history = { replaceState: vi.fn() }; expect(captureEmailCallback({ pathname: EMAIL_CALLBACK_PATH, search, hash }, history)).toEqual({ kind: 'invalid' }); expect(history.replaceState).toHaveBeenCalled();
});
it('leaves existing non-email routes alone during preparation', () => {
  const history = { replaceState: vi.fn() }; expect(captureEmailCallback({ pathname: '/catalogue', search: '?sort=name', hash: '' }, history).kind).toBe('none'); expect(history.replaceState).not.toHaveBeenCalled();
});
for (const [search, hash] of [['', '#access_token=synthetic&refresh_token=synthetic'], ['?code=synthetic-code', ''], ['?next=https://example.invalid', '#anything']]) it('strips credentials and unexpected URL data on the additive email entry', () => {
  const history = { replaceState: vi.fn() }; captureEmailCallback({ pathname: EMAIL_CALLBACK_PATH, search: '?code=earlier-synthetic-code', hash: '' }, history); expect(captureEmailCallback({ pathname: '/email-login', search, hash }, history)).toEqual({ kind: 'none' }); expect(history.replaceState).toHaveBeenCalledWith(null, '', '/email-login'); expect(takeEmailCallback().kind).toBe('none');
});
for (const pathname of ['/email-login/', '/email-login///', '/EMAIL-LOGIN', '/%65mail-login', '/email%2Dlogin']) it('cleans and canonicalizes Router-matched email entry variant ' + pathname, () => {
  const history = { replaceState: vi.fn() }; expect(captureEmailCallback({ pathname, search: '?code=synthetic', hash: '#access_token=synthetic' }, history).kind).toBe('none'); expect(history.replaceState).toHaveBeenCalledWith(null, '', '/email-login'); expect(takeEmailCallback().kind).toBe('none');
});
for (const pathname of ['/email-login/callback/', '/email-login/callback///', '/EMAIL-LOGIN/CALLBACK', '/%65mail-login/callback', '/email-login/%63allback']) it('cleans and canonicalizes Router-matched callback variant ' + pathname, () => {
  const history = { replaceState: vi.fn() }; expect(captureEmailCallback({ pathname, search: '', hash: '#access_token=synthetic' }, history).kind).toBe('invalid'); expect(history.replaceState).toHaveBeenCalledWith(null, '', EMAIL_CALLBACK_PATH); expect(takeEmailCallback().kind).toBe('invalid');
});
for (const pathname of ['/catalogue/', '/LOGIN', '/other/email-login', '/email-login/other', '/email-login%2Fcallback']) it('does not clean unrelated paths outside the actual new Router matches ' + pathname, () => {
  const history = { replaceState: vi.fn() }; expect(captureEmailCallback({ pathname, search: '?existing=value', hash: '#existing' }, history).kind).toBe('none'); expect(history.replaceState).not.toHaveBeenCalled();
});
it('only explicit review or email modes enable the candidate; unknown values keep legacy mode', () => {
  expect(resolveAuthMode('review')).toBe('review'); expect(resolveAuthMode('email')).toBe('email'); expect(resolveAuthMode(undefined)).toBe('legacy'); expect(resolveAuthMode('true')).toBe('legacy');
});
