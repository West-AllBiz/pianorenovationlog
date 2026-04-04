
CREATE TABLE IF NOT EXISTS public.catalogue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  piano_id UUID REFERENCES public.pianos(id) ON DELETE CASCADE UNIQUE NOT NULL,
  visible BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'coming_soon' NOT NULL,
  public_description TEXT DEFAULT '',
  highlights TEXT[] DEFAULT '{}',
  price_display TEXT DEFAULT '',
  show_restoration_notes BOOLEAN DEFAULT FALSE,
  public_restoration_note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.catalogue ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read visible catalogue entries
CREATE POLICY "Public can read visible catalogue"
ON public.catalogue FOR SELECT
TO anon, authenticated
USING (visible = TRUE);

-- Authenticated editors can read all entries (for management)
CREATE POLICY "Editors can read all catalogue"
ON public.catalogue FOR SELECT
TO authenticated
USING (can_edit(auth.uid()));

-- Contributors and admins can insert/update/delete
CREATE POLICY "Editors can insert catalogue"
ON public.catalogue FOR INSERT
TO authenticated
WITH CHECK (can_edit(auth.uid()));

CREATE POLICY "Editors can update catalogue"
ON public.catalogue FOR UPDATE
TO authenticated
USING (can_edit(auth.uid()));

CREATE POLICY "Admin can delete catalogue"
ON public.catalogue FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Also allow anon to read pianos, piano_photos, and character_notes for catalogue
CREATE POLICY "Anon can read pianos"
ON public.pianos FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anon can read piano photos"
ON public.piano_photos FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anon can read character notes"
ON public.character_notes FOR SELECT
TO anon
USING (true);
