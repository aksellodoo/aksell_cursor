-- Fix tasks foreign keys to reference profiles instead of auth.users
-- This resolves the error: "Could not find a relationship between 'tasks' and 'profiles'"

-- 1. Fix assigned_to foreign key
ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_assigned_to_fkey
  FOREIGN KEY (assigned_to)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- 2. Fix created_by foreign key
ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- 3. Update created_by to allow NULL (in case of user deletion)
ALTER TABLE public.tasks
  ALTER COLUMN created_by DROP NOT NULL;
