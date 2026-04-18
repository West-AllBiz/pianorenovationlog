-- Part A: Add visibility columns
ALTER TABLE public.catalogue
  ADD COLUMN IF NOT EXISTS show_labor_hours boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_cost_breakdown boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_task_list boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.catalogue.show_labor_hours IS
  'Position B default: public visitors see total hours invested. Hides cost.';
COMMENT ON COLUMN public.catalogue.show_cost_breakdown IS
  'Hybrid override: exposes dollar labor cost + parts + total. Reserved for Diamond/Art Piece lane.';
COMMENT ON COLUMN public.catalogue.show_task_list IS
  'Expands the labor block to show per-category completed task list. Done and in_progress only, never n/a.';

-- Part E: Public RLS for joined tables, scoped to visible catalogue pianos only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'restoration_tasks'
      AND policyname = 'Public read tasks for visible pianos'
  ) THEN
    CREATE POLICY "Public read tasks for visible pianos"
      ON public.restoration_tasks FOR SELECT
      TO anon
      USING (EXISTS (
        SELECT 1 FROM public.catalogue c
        WHERE c.piano_id = restoration_tasks.piano_id
          AND c.visible = true
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'expenses'
      AND policyname = 'Public read expenses for visible pianos'
  ) THEN
    CREATE POLICY "Public read expenses for visible pianos"
      ON public.expenses FOR SELECT
      TO anon
      USING (EXISTS (
        SELECT 1 FROM public.catalogue c
        WHERE c.piano_id = expenses.piano_id
          AND c.visible = true
      ));
  END IF;
END $$;