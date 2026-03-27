
-- Workflow stages table
CREATE TABLE IF NOT EXISTS public.workflow_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.workflow_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read workflow stages" ON public.workflow_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage stages" ON public.workflow_stages FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default stages
INSERT INTO public.workflow_stages (name, sort_order, is_default, active) VALUES
('Acquired', 1, TRUE, TRUE),
('Pickup Scheduled', 2, TRUE, TRUE),
('Transport', 3, TRUE, TRUE),
('Intake Inspection', 4, TRUE, TRUE),
('Evaluation', 5, TRUE, TRUE),
('Awaiting Parts', 6, TRUE, TRUE),
('Restoration Work', 7, TRUE, TRUE),
('Regulation', 8, TRUE, TRUE),
('Voicing', 9, TRUE, TRUE),
('Tuning', 10, TRUE, TRUE),
('Cabinet Work', 11, TRUE, TRUE),
('In Finishing Queue', 12, TRUE, TRUE),
('Final QC', 13, TRUE, TRUE),
('Ready for Sale', 14, TRUE, TRUE),
('Client Pickup', 15, TRUE, TRUE),
('Donation Delivery', 16, TRUE, TRUE),
('Archived', 17, TRUE, TRUE);

-- Piano photos metadata table
CREATE TABLE IF NOT EXISTS public.piano_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  piano_id UUID REFERENCES public.pianos(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.piano_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read piano photos" ON public.piano_photos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert piano photos" ON public.piano_photos FOR INSERT TO authenticated WITH CHECK (can_edit(auth.uid()));
CREATE POLICY "Update piano photos" ON public.piano_photos FOR UPDATE TO authenticated USING (can_edit(auth.uid()));
CREATE POLICY "Admin delete photos" ON public.piano_photos FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR uploaded_by = auth.uid());

-- Storage bucket for piano photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('piano-photos', 'piano-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']);

-- Storage RLS policies
CREATE POLICY "Public read piano photos" ON storage.objects FOR SELECT USING (bucket_id = 'piano-photos');
CREATE POLICY "Auth upload piano photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'piano-photos');
CREATE POLICY "Auth update piano photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'piano-photos');
CREATE POLICY "Auth delete piano photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'piano-photos');
