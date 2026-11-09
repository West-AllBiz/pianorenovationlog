import { matchRoutes } from 'react-router-dom';
import { EMAIL_CALLBACK_PATH } from './emailConfig';
export type EmailCallback = { kind: 'none' } | { kind: 'invalid' } | { kind: 'code'; code: string };
let initialCallback: EmailCallback = { kind: 'none' };
export function captureEmailCallback(location: Pick<Location, 'pathname' | 'search' | 'hash'>, history: Pick<History, 'replaceState'>): EmailCallback {
  // Use the same matcher as App's default routes, including case, URL decoding
  // and trailing-slash behavior. This import does not initialize the Auth client.
  const matches = matchRoutes([{ path: '/email-login' }, { path: EMAIL_CALLBACK_PATH }], { pathname: location.pathname });
  const path = matches?.[matches.length - 1]?.route.path;
  if (path === '/email-login') {
    if (location.pathname !== path || location.search || location.hash) history.replaceState(null, '', path);
    initialCallback = { kind: 'none' };
    return initialCallback;
  }
  if (path !== EMAIL_CALLBACK_PATH) return { kind: 'none' };
  const query = new URLSearchParams(location.search);
  const code = query.get('code');
  const valid = !location.hash && Array.from(query).length === 1 && /^[A-Za-z0-9._~-]{8,512}$/.test(code ?? '');
  // Executed before App/client import. Neither generated Auth nor analytics sees the code.
  history.replaceState(null, '', EMAIL_CALLBACK_PATH);
  initialCallback = valid ? { kind: 'code', code: code! } : { kind: 'invalid' };
  return initialCallback;
}
export function takeEmailCallback(): EmailCallback {
  const callback = initialCallback;
  initialCallback = { kind: 'none' };
  return callback;
}
