ALTER TABLE public.piano_photos ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'acquired';
-- Valid values: 'acquired', 'renovation', 'finished'