-- Rename existing "Sanding" template to "Initial Sanding (40-240 grit)"
UPDATE public.task_templates SET task_name = 'Initial Sanding (40-240 grit)' WHERE task_name = 'Sanding';

-- Add medium and fine sanding templates
INSERT INTO public.task_templates (task_name, category, default_status, sort_order)
VALUES
  ('Medium Sanding (400-1000 grit)', 'cabinet_work', 'todo', 29),
  ('Fine Sanding (2000-5000 grit)', 'cabinet_work', 'todo', 30)
ON CONFLICT DO NOTHING;

-- Bump sort_order for items that were at 29+ to make room
UPDATE public.task_templates SET sort_order = sort_order + 2 WHERE sort_order >= 29 AND task_name NOT IN ('Medium Sanding (400-1000 grit)', 'Fine Sanding (2000-5000 grit)');

-- Also rename existing restoration_tasks for any piano that has "Sanding"
UPDATE public.restoration_tasks SET title = 'Initial Sanding (40-240 grit)' WHERE title = 'Sanding';