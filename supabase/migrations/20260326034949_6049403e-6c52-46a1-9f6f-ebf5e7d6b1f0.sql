
-- Create task_templates table
CREATE TABLE IF NOT EXISTS public.task_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_name TEXT NOT NULL,
  category TEXT NOT NULL,
  default_status TEXT DEFAULT 'todo',
  sort_order INTEGER,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read
CREATE POLICY "Read task templates" ON public.task_templates FOR SELECT TO authenticated USING (true);

-- Only admins can manage templates
CREATE POLICY "Admin manage templates" ON public.task_templates FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Trigger to update updated_at
CREATE TRIGGER update_task_templates_updated_at
  BEFORE UPDATE ON public.task_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-populate function for new pianos
CREATE OR REPLACE FUNCTION public.auto_populate_tasks()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.restoration_tasks (piano_id, title, category, status)
  SELECT NEW.id, task_name, category, default_status
  FROM public.task_templates
  WHERE active = TRUE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on piano insert
CREATE TRIGGER on_piano_created
  AFTER INSERT ON public.pianos
  FOR EACH ROW EXECUTE FUNCTION auto_populate_tasks();

-- Seed the 37 standard task templates
INSERT INTO public.task_templates (task_name, category, default_status, sort_order) VALUES
('Initial Cleaning & Assessment',     'cleaning',     'todo', 1),
('Soundboard Inspection',             'structural',   'todo', 2),
('Bridge Inspection',                 'structural',   'todo', 3),
('Pinblock Evaluation',               'structural',   'todo', 4),
('Cabinet & Case Inspection',         'cabinet_work', 'todo', 5),
('String Inspection & Cleaning',      'cleaning',     'todo', 6),
('Tuning Pin Tightness Check',        'regulation',   'todo', 7),
('Action Removal & Cleaning',         'cleaning',     'todo', 8),
('Key Cleaning & Polishing',          'cleaning',     'todo', 9),
('Key Leveling',                      'regulation',   'todo', 10),
('Key Bushing Inspection & Repair',   'regulation',   'todo', 11),
('Key Strap Inspection & Replacement','regulation',   'todo', 12),
('Flange Re-centering',               'regulation',   'todo', 13),
('Whippen Inspection & Repair',       'regulation',   'todo', 14),
('Lost Motion Correction',            'regulation',   'todo', 15),
('Let-Off Regulation',                'regulation',   'todo', 16),
('Drop Regulation',                   'regulation',   'todo', 17),
('Damper Regulation',                 'regulation',   'todo', 18),
('Hammer Shaping & Filing',           'voicing',      'todo', 19),
('Hammer Voicing',                    'voicing',      'todo', 20),
('Touchweight Check',                 'regulation',   'todo', 21),
('Pedal Inspection',                  'pedal_repair', 'todo', 22),
('Pedal Bushing Replacement',         'pedal_repair', 'todo', 23),
('Trapwork Adjustment & Lubrication', 'pedal_repair', 'todo', 24),
('Sostenuto & Soft Pedal Check',      'pedal_repair', 'todo', 25),
('Pitch Raise',                       'tuning',       'todo', 26),
('Fine Tuning',                       'tuning',       'todo', 27),
('Sanding',                           'cabinet_work', 'todo', 28),
('Stain / Base Coat',                 'cabinet_work', 'todo', 29),
('Clear Coat / Top Coat',             'cabinet_work', 'todo', 30),
('Hardware Cleaning & Polishing',     'cabinet_work', 'todo', 31),
('Caster Inspection & Replacement',   'cabinet_work', 'todo', 32),
('Final Regulation Check',            'regulation',   'todo', 33),
('Final Voicing Check',               'voicing',      'todo', 34),
('Final Tuning',                      'tuning',       'todo', 35),
('Photography & Listing Prep',        'final_qc',     'todo', 36),
('Final QC Sign-Off',                 'final_qc',     'todo', 37);
