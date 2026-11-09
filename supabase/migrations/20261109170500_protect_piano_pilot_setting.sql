-- DRAFT ONLY. Not executed or PostgreSQL-tested. Requires explicit review/approval.
-- Contain one exact app_settings row for normal anon/authenticated RLS access.
-- No values are selected, changed, copied, logged or returned by this draft.
-- Service-role/owner/BYPASSRLS behavior and all other rows/policies are unchanged.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
LOCK TABLE public.app_settings IN SHARE ROW EXCLUSIVE MODE;

DO $preflight$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'app_settings'
      AND c.relkind = 'r' AND c.relrowsecurity
  ) THEN RAISE EXCEPTION 'Expected RLS-enabled public.app_settings table.'; END IF;
  IF (SELECT count(*) FROM pg_roles WHERE rolname IN ('anon', 'authenticated')) <> 2
  THEN RAISE EXCEPTION 'Expected runtime roles are absent.'; END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policy WHERE polrelid = 'public.app_settings'::regclass
      AND polname = 'protect_piano_pilot_read_token'
  ) THEN RAISE EXCEPTION 'Policy name already exists; review outcome before retrying.'; END IF;
  IF (SELECT count(*) FROM public.app_settings WHERE "key" = 'piano_pilot_read_token') <> 1
  THEN RAISE EXCEPTION 'Expected exactly one protected key; no value inspected.'; END IF;
END;
$preflight$;

CREATE POLICY protect_piano_pilot_read_token
  ON public.app_settings
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING ("key" IS DISTINCT FROM 'piano_pilot_read_token')
  WITH CHECK ("key" IS DISTINCT FROM 'piano_pilot_read_token');

DO $postcheck$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.app_settings'::regclass
      AND polname = 'protect_piano_pilot_read_token'
      AND NOT polpermissive AND polcmd = '*'
      AND cardinality(polroles) = 2
      AND (SELECT oid FROM pg_roles WHERE rolname = 'anon') = ANY(polroles)
      AND (SELECT oid FROM pg_roles WHERE rolname = 'authenticated') = ANY(polroles)
      AND polqual IS NOT NULL AND polwithcheck IS NOT NULL
  ) THEN RAISE EXCEPTION 'Restrictive policy metadata assertion failed.'; END IF;
END;
$postcheck$;
COMMIT;
-- Execution alone is not acceptance: perform separately reviewed runtime-role tests.
-- Do not test by retrieving the actual protected value. Use synthetic DB fixtures.
