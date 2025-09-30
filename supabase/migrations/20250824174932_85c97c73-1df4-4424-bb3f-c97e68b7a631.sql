-- Fix the specific constraint that's blocking user deletion
-- Based on the error logs, fix tasks_assigned_to_fkey constraint

ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey,
  ADD CONSTRAINT tasks_assigned_to_fkey 
    FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Also fix any task_history constraints that might reference users
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_history') THEN
    -- Make changed_by nullable first
    ALTER TABLE public.task_history 
      ALTER COLUMN changed_by DROP NOT NULL;
    
    -- Fix the foreign key
    ALTER TABLE public.task_history
      DROP CONSTRAINT IF EXISTS task_history_changed_by_fkey,
      ADD CONSTRAINT task_history_changed_by_fkey 
        FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;