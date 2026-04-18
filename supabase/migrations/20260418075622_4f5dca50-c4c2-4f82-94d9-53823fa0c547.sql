DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'app_settings'
      AND policyname = 'Anon read app settings'
  ) THEN
    CREATE POLICY "Anon read app settings"
      ON public.app_settings FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;