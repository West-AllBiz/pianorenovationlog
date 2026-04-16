
-- Add instrument_type column
ALTER TABLE public.task_templates
ADD COLUMN IF NOT EXISTS instrument_type TEXT DEFAULT 'piano';

-- Mark all existing as piano
UPDATE public.task_templates SET instrument_type = 'piano' WHERE instrument_type IS NULL;

-- Update auto-populate trigger to be instrument-type aware
CREATE OR REPLACE FUNCTION public.auto_populate_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_instrument_type TEXT;
BEGIN
  IF NEW.piano_type = 'harp' THEN
    v_instrument_type := 'harp';
  ELSE
    v_instrument_type := 'piano';
  END IF;

  INSERT INTO public.restoration_tasks (piano_id, title, category, status)
  SELECT NEW.id, task_name, category, COALESCE(default_status, 'todo')
  FROM public.task_templates
  WHERE active = TRUE
  AND instrument_type = v_instrument_type;

  RETURN NEW;
END;
$$;
