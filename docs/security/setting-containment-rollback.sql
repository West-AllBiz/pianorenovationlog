-- DRAFT ONLY. NOT an automatic rollback or authorization to reopen this row.
-- Dropping this gate restores the previously broad anon/authenticated access and
-- can re-expose a credential-valued setting. Prefer forward repair/keeping the gate.
-- Use only after a separate exact security decision, checked against the deployed
-- policy definition and any later dependencies. No row/value changes are made.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
LOCK TABLE public.app_settings IN SHARE ROW EXCLUSIVE MODE;
DO $preflight$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.app_settings'::regclass
      AND polname = 'protect_piano_pilot_read_token'
      AND NOT polpermissive AND polcmd = '*'
      AND cardinality(polroles) = 2
      AND (SELECT oid FROM pg_roles WHERE rolname = 'anon') = ANY(polroles)
      AND (SELECT oid FROM pg_roles WHERE rolname = 'authenticated') = ANY(polroles)
  ) THEN RAISE EXCEPTION 'Expected exact policy metadata not found; inspect before rollback.'; END IF;
END;
$preflight$;
DROP POLICY protect_piano_pilot_read_token ON public.app_settings;
COMMIT;
