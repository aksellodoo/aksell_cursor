-- Remove list_in_pending field from all tables
-- This field no longer makes sense for task management

-- Drop indexes that use list_in_pending
DROP INDEX IF EXISTS idx_tasks_pending_expected;
DROP INDEX IF EXISTS idx_tasks_pending_deadline;

-- Remove list_in_pending column from tasks table
ALTER TABLE public.tasks DROP COLUMN IF EXISTS list_in_pending;

-- Remove list_in_pending column from task_templates table
ALTER TABLE public.task_templates DROP COLUMN IF EXISTS list_in_pending;

-- Remove list_in_pending column from task_series table
ALTER TABLE public.task_series DROP COLUMN IF EXISTS list_in_pending;
