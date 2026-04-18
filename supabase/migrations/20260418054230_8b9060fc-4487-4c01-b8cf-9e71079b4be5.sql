-- Labor estimates lookup
CREATE TABLE IF NOT EXISTS public.task_labor_estimates (
  task_title text PRIMARY KEY,
  labor_hours numeric(5,2) NOT NULL,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO public.task_labor_estimates (task_title, labor_hours) VALUES
  ('Serial Number Verified', 0.5),
  ('Provenance Documented', 1.5),
  ('Action regulation', 6.0),
  ('Hardware Cleaning & Polishing', 2.0),
  ('Caster Inspection & Replacement', 1.0),
  ('Between-Coat Sanding', 1.5),
  ('Initial Sanding (40-240 grit)', 4.0),
  ('Polish & Final Buffing', 2.0),
  ('Stain / Base Coat', 3.0),
  ('Clear Coat / Top Coat', 2.0),
  ('Bench Sanding & Finishing', 2.0),
  ('Legs Sanding & Finishing', 2.0),
  ('Cabinet & Case Inspection', 0.5),
  ('Action Removal & Cleaning', 2.0),
  ('String Inspection & Cleaning', 1.5),
  ('Initial Cleaning & Assessment', 1.0),
  ('Interior Debris Removal (Soundboard / Plate)', 1.0),
  ('Pedal Cleaning & Polishing', 0.75),
  ('Key Cleaning & Polishing', 1.5),
  ('Brass & Hardware Cleaning', 1.0),
  ('Final QC Sign-Off', 1.0),
  ('Photography & Listing Prep', 1.5),
  ('Listing Copy Written', 1.0),
  ('Ad Posted (eBay)', 0.5),
  ('Ad Posted (Craigslist)', 0.25),
  ('Ad Posted (Facebook Marketplace)', 0.25),
  ('Price Set & Confirmed', 0.25),
  ('Trapwork Adjustment & Lubrication', 1.0),
  ('Sostenuto & Soft Pedal Check', 0.5),
  ('Pedal Inspection', 0.5),
  ('Pedal Bushing Replacement', 1.5),
  ('Touchweight Check', 1.0),
  ('Lost Motion Correction', 1.5),
  ('Final Regulation Check', 2.0),
  ('Damper Regulation', 1.5),
  ('Flange Re-centering', 2.0),
  ('Key Leveling', 1.5),
  ('Tuning Pin Tightness Check', 0.5),
  ('Whippen Inspection & Repair', 1.5),
  ('Drop Regulation', 1.5),
  ('Key Bushing Inspection & Repair', 2.0),
  ('Let-Off Regulation', 1.5),
  ('Key Strap Inspection & Replacement', 1.0),
  ('Keytop Replacement', 4.0),
  ('Damper Felt Inspection & Replacement', 1.5),
  ('Broken String Repair / Replacement', 1.0),
  ('Soundboard Crack Stabilization', 4.0),
  ('Bridge Inspection', 0.75),
  ('Pinblock Evaluation', 1.0),
  ('Plate Crack Inspection', 0.5),
  ('Soundboard Inspection', 0.75),
  ('Fine Tuning', 1.5),
  ('Final Tuning', 1.5),
  ('Pitch Raise', 1.5),
  ('Hammer Voicing', 3.0),
  ('Hammer Shaping & Filing', 2.0),
  ('Final Voicing Check', 1.0)
ON CONFLICT (task_title) DO NOTHING;

-- App settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO public.app_settings (key, value) VALUES
  ('technician_hourly_rate', '100'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Auto-fill trigger on restoration_tasks
CREATE OR REPLACE FUNCTION public.auto_fill_labor_hours()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_estimate numeric;
BEGIN
  IF NEW.status = 'done'
     AND COALESCE(OLD.status, '') <> 'done'
     AND COALESCE(NEW.labor_hours, 0) = 0 THEN
    SELECT labor_hours INTO v_estimate
    FROM public.task_labor_estimates
    WHERE task_title = NEW.title;
    IF v_estimate IS NOT NULL THEN
      NEW.labor_hours := v_estimate;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS task_labor_hours_autofill ON public.restoration_tasks;
CREATE TRIGGER task_labor_hours_autofill
  BEFORE UPDATE ON public.restoration_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_fill_labor_hours();

-- RLS matching project patterns
ALTER TABLE public.task_labor_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read task labor estimates"
  ON public.task_labor_estimates FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admin manage labor estimates"
  ON public.task_labor_estimates FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Read app settings"
  ON public.app_settings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Editors manage app settings"
  ON public.app_settings FOR ALL
  TO authenticated
  USING (can_edit(auth.uid()))
  WITH CHECK (can_edit(auth.uid()));