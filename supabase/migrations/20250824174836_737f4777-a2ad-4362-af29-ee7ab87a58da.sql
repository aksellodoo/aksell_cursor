-- Fix protheus_tables table to allow user deletion
-- Step 1: Make created_by nullable
ALTER TABLE public.protheus_tables 
  ALTER COLUMN created_by DROP NOT NULL;

-- Step 2: Drop and recreate foreign key with proper CASCADE behavior
ALTER TABLE public.protheus_tables
  DROP CONSTRAINT IF EXISTS protheus_tables_created_by_fkey,
  ADD CONSTRAINT protheus_tables_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Also fix any other protheus-related tables that might have the same issue
ALTER TABLE public.protheus_dynamic_tables
  DROP CONSTRAINT IF EXISTS protheus_dynamic_tables_created_by_fkey,
  ADD CONSTRAINT protheus_dynamic_tables_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix protheus_sync_logs if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'protheus_sync_logs') THEN
    ALTER TABLE public.protheus_sync_logs
      DROP CONSTRAINT IF EXISTS protheus_sync_logs_executed_by_fkey,
      ADD CONSTRAINT protheus_sync_logs_executed_by_fkey 
        FOREIGN KEY (executed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;