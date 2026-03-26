
ALTER TABLE public.pianos
  ADD COLUMN IF NOT EXISTS finish_plan text DEFAULT '',
  ADD COLUMN IF NOT EXISTS selling_channel text DEFAULT '',
  ADD COLUMN IF NOT EXISTS pricing_notes text DEFAULT '',
  ADD COLUMN IF NOT EXISTS lane text DEFAULT '';
