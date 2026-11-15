-- Read-only; run ONLY against the owned Website and Workshop destination.
-- This records missing components without creating tables or changing policies.
SELECT jsonb_build_object(
  'captured_at', now(),
  'required_public_tables', (
    SELECT jsonb_agg(jsonb_build_object('name', name, 'present', to_regclass('public.' || name) IS NOT NULL))
    FROM unnest(ARRAY['catalogue','task_templates','workflow_stages','piano_photos',
      'task_labor_estimates','app_settings','user_roles','profiles','restoration_tasks',
      'condition_inspections','expenses','pianos','donation_records','character_notes',
      'client_records','performance_profiles','activity_log']) AS name
  ),
  'auth_account_count', (SELECT count(*) FROM auth.users),
  'piano_photo_bucket', (SELECT jsonb_build_object('id', id, 'public', public) FROM storage.buckets WHERE id='piano-photos'),
  'piano_photo_objects', (SELECT count(*) FROM storage.objects WHERE bucket_id='piano-photos'),
  'public_table_rls', (SELECT jsonb_agg(jsonb_build_object('table', c.relname, 'enabled', c.relrowsecurity))
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r')
) AS preflight;
