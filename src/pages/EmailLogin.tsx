import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AUTH_MODE, CANONICAL_ORIGIN } from '@/auth/emailConfig';
import { browserEmailFlow } from '@/auth/browserEmailFlow';
import { takeEmailCallback } from '@/auth/emailCallback';
import { useAuth } from '@/hooks/useAuth';

export default function EmailLogin({ callback = false }: { callback?: boolean }) {
  const navigate = useNavigate();
  const auth = useAuth();
  const [flow] = useState(() => { try { return browserEmailFlow(); } catch { return null; } });
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(() => !!flow?.pending());
  const [busy, setBusy] = useState(false);
  const [adopted, setAdopted] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);
  const [expectedUser, setExpectedUser] = useState<string | null>(null);
  const [verified, setVerified] = useState<Awaited<ReturnType<NonNullable<typeof flow>['exchange']>> | null>(null);
  const committed = useRef(false);
  const [message, setMessage] = useState('Use the real email address of an existing, confirmed Workshop account.');
  const generation = useRef(0);
  const operation = useRef<AbortController | null>(null);
  const working = useRef(false);
  useEffect(() => {
    const invalidate = () => {
      generation.current++; operation.current?.abort(); working.current = false; setVerified(null); setBusy(false);
      if (!committed.current) setMessage('Sign-in was interrupted before you chose to save it. Start a new email sign-in request to continue.');
    };
    window.addEventListener('pagehide', invalidate);
    return () => { invalidate(); window.removeEventListener('pagehide', invalidate); };
  }, []);
  useEffect(() => {
    if (!callback) return;
    const initial = takeEmailCallback();
    if (initial.kind !== 'code' || !flow) { setMessage('Invalid or unsupported sign-in callback. No URL token was accepted. Start from the email sign-in page.'); return; }
    const epoch = generation.current;
    const controller = new AbortController(); operation.current = controller; working.current = true; setBusy(true);
    setMessage('Verifying your existing account and Workshop access…');
    void flow.exchange(initial.code, controller.signal).then(tokens => {
      if (epoch !== generation.current || controller.signal.aborted) return;
      setExpectedUser(tokens.userId);
      setVerified(tokens);
      setMessage('Email and current Workshop role verified. Continue to save this sign-in on this device.');
    }).catch(() => { if (epoch === generation.current) setMessage('The link or account access could not be verified. Start a new request only when ready to try again.'); })
      .finally(() => { if (epoch === generation.current) { working.current = false; setBusy(false); setPending(false); } });
  }, [callback, flow]);
  useEffect(() => { if (sessionSaved && auth.user?.id === expectedUser && !auth.loading && !auth.authError) navigate('/dashboard', { replace: true }); }, [sessionSaved, expectedUser, auth.user, auth.loading, auth.authError, navigate]);
  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!flow?.canSend || working.current || pending) return;
    const epoch = generation.current; const controller = new AbortController(); operation.current = controller;
    working.current = true; setBusy(true);
    try {
      await flow.send(email, controller.signal);
      if (epoch === generation.current) setMessage('If this is an eligible existing account, an email was requested. Copy its link into this same tab within 15 minutes; opening a new tab will not work. Delivery is not confirmed here.');
    } catch { if (epoch === generation.current) setMessage('The request was not confirmed and may still arrive. No automatic retry was made.'); }
    finally { if (epoch === generation.current) { working.current = false; setBusy(false); setPending(!!flow.pending()); } }
  };
  const continueSignIn = async () => {
    if (!verified || working.current || committed.current) return;
    // Explicit commitment boundary: SDK setSession cannot be cancelled. Leaving after
    // this click may still save a session; never sign out a newer unrelated session.
    committed.current = true; working.current = true; setBusy(true); setAdopted(true);
    const epoch = generation.current;
    const tokens = verified; setVerified(null);
    setMessage('Saving the sign-in you requested. This may complete even if you leave. Use Sign out when finished.');
    try {
      const { error } = await auth.saveEmailSession({ access_token: tokens.access_token, refresh_token: tokens.refresh_token });
      if (epoch !== generation.current) return;
      if (error) throw new Error('Session adoption not confirmed.');
      setSessionSaved(true);
      setMessage('Sign-in saved. Checking current Workshop access…');
    } catch { if (epoch === generation.current) setMessage('Sign-in could not be confirmed. Use Sign out and restart to clear any session before retrying.'); }
    finally { if (epoch === generation.current) { working.current = false; setBusy(false); } }
  };
  const cancel = () => {
    generation.current++; operation.current?.abort(); working.current = false;
    try { flow?.cancel(); } catch { /* No access is granted on storage failure. */ }
    setBusy(false); setPending(false); setVerified(null);
    setMessage('Pending sign-in cancelled in this tab. An email may already have been sent, but its link will no longer work here.');
  };
  return <main className="min-h-screen bg-background flex items-center justify-center p-6"><section className="w-full max-w-md space-y-5">
    <Link to="/catalogue" className="text-sm underline">Back to catalogue</Link>
    <h1 className="font-heading text-2xl">Workshop email sign-in</h1>
    {AUTH_MODE !== 'email' && <p role="note" className="rounded border p-3 text-sm">{flow?.canSend ? 'Email sign-in is available alongside existing staff access.' : 'Email sign-in is being prepared alongside existing staff access.'} Name-based access remains unchanged until a separately reviewed migration. This page is not a complete security migration.</p>}
    {!flow?.canSend && <p className="text-sm">Email sending is disabled or this is not the approved {CANONICAL_ORIGIN} site.</p>}
    {!callback && <form onSubmit={send} action="/email-login" method="post" className="space-y-3">
      <Label htmlFor="workshop-email">Account email</Label>
      <Input id="workshop-email" type="email" autoComplete="email" maxLength={254} required value={email} onChange={event => setEmail(event.target.value)} disabled={busy || pending} />
      <Button type="submit" disabled={!flow?.canSend || busy || pending || !email.trim()}>Request sign-in email</Button>
    </form>}
    {!committed.current && (pending || busy || verified) && <Button variant="outline" type="button" onClick={cancel}>Cancel pending request</Button>}
    {adopted && !busy && <Button type="button" variant="outline" onClick={async () => { try { await auth.signOut(); setAdopted(false); navigate('/email-login', { replace: true }); } catch { setMessage('Local access cleared, but server sign-out was not confirmed. Contact the administrator.'); } }}>Sign out and restart</Button>}
    {verified && !adopted && <div className="space-y-3"><p className="text-sm">Continue saves this sign-in using Workshop’s existing session storage. Once selected, sign-in may finish even if you leave this page. Use Sign out afterward to end it.</p><Button type="button" disabled={busy} onClick={continueSignIn}>Continue into Workshop</Button></div>}
    {callback && !busy && !verified && auth.user && !auth.loading && !auth.authError && <Button type="button" variant="outline" onClick={() => navigate('/dashboard', { replace: true })}>Open current signed-in account</Button>}
    {auth.authError && <p role="alert">{auth.authError}</p>}
    <p role="status" aria-live="polite">{message}</p>
    {callback && !busy && !adopted && !verified && <Link to="/email-login" className="underline">Start a new email sign-in request</Link>}
    <p className="text-xs text-muted-foreground">No account creation or password reset. Copy the email link into the requesting tab. Another tab or browser cannot complete this flow. A successful sign-in uses Workshop’s existing session storage and refresh behavior. Sign out when finished.</p>
  </section></main>;
}
