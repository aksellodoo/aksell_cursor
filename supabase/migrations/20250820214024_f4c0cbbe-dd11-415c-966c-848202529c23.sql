-- Remove completely any remaining auto_setup_protheus_table function
DROP FUNCTION IF EXISTS public.auto_setup_protheus_table() CASCADE;

-- Add pending_deletion columns to all protheus tables using a safer approach
DO $$
DECLARE
  table_record RECORD;
  table_name text;
  column_exists boolean;
BEGIN
  -- Get all dynamic protheus tables
  FOR table_record IN 
    SELECT DISTINCT supabase_table_name 
    FROM protheus_dynamic_tables 
    WHERE supabase_table_name IS NOT NULL
  LOOP
    table_name := table_record.supabase_table_name;
    
    -- Check if pending_deletion column exists
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = table_record.supabase_table_name 
        AND column_name = 'pending_deletion'
    ) INTO column_exists;
    
    -- Add pending_deletion column if it doesn't exist
    IF NOT column_exists THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN pending_deletion BOOLEAN NOT NULL DEFAULT false', table_name);
      RAISE NOTICE 'Added pending_deletion column to: %', table_name;
    END IF;
    
    -- Check if pending_deletion_at column exists
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = table_record.supabase_table_name 
        AND column_name = 'pending_deletion_at'
    ) INTO column_exists;
    
    -- Add pending_deletion_at column if it doesn't exist  
    IF NOT column_exists THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN pending_deletion_at TIMESTAMPTZ', table_name);
      RAISE NOTICE 'Added pending_deletion_at column to: %', table_name;
    END IF;
    
    -- Create index on pending_deletion if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND tablename = table_record.supabase_table_name 
        AND indexname = format('idx_%s_pending_deletion', table_record.supabase_table_name)
    ) THEN
      EXECUTE format('CREATE INDEX idx_%I_pending_deletion ON public.%I (pending_deletion)', table_name, table_name);
      RAISE NOTICE 'Added index for pending_deletion on: %', table_name;
    END IF;
  END LOOP;
END $$;