-- PART C1: expand status check constraint to include 'n/a'
ALTER TABLE public.restoration_tasks
  DROP CONSTRAINT IF EXISTS restoration_tasks_status_check;

ALTER TABLE public.restoration_tasks
  ADD CONSTRAINT restoration_tasks_status_check
  CHECK (status IN ('todo', 'in_progress', 'done', 'blocked', 'n/a'));