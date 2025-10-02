-- Add pending_deletion columns to all protheus tables
DO $$
DECLARE
  table_record RECORD;
  table_name text;
BEGIN
  -- Get all dynamic protheus tables
  FOR table_record IN 
    SELECT DISTINCT supabase_table_name 
    FROM protheus_dynamic_tables 
    WHERE supabase_table_name IS NOT NULL
  LOOP
    table_name := table_record.supabase_table_name;
    
    -- Add pending_deletion column if it doesn't exist
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS pending_deletion BOOLEAN NOT NULL DEFAULT false', table_name);
    
    -- Add pending_deletion_at column if it doesn't exist  
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS pending_deletion_at TIMESTAMPTZ', table_name);
    
    -- Create index on pending_deletion if it doesn't exist
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_pending_deletion ON public.%I (pending_deletion)', table_name, table_name);
    
    RAISE NOTICE 'Added pending_deletion columns to table: %', table_name;
  END LOOP;
END $$;