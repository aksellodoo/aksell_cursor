-- Add soft delete functionality for Protheus tables

-- Function to add soft delete columns to any dynamic table
CREATE OR REPLACE FUNCTION public.add_soft_delete_columns(table_name_param text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validate table name (only allow lowercase letters, numbers, underscores)
  IF table_name_param !~ '^[a-z0-9_]+$' THEN
    RETURN json_build_object('success', false, 'error', 'Invalid table name format');
  END IF;

  -- Add pending_deletion column if it doesn't exist
  EXECUTE format('
    ALTER TABLE public.%I 
    ADD COLUMN IF NOT EXISTS pending_deletion boolean NOT NULL DEFAULT false
  ', table_name_param);
  
  -- Add pending_deletion_at column if it doesn't exist
  EXECUTE format('
    ALTER TABLE public.%I 
    ADD COLUMN IF NOT EXISTS pending_deletion_at timestamp with time zone
  ', table_name_param);

  -- Create index for performance on pending_deletion queries
  EXECUTE format('
    CREATE INDEX IF NOT EXISTS idx_%I_pending_deletion 
    ON public.%I (pending_deletion) 
    WHERE pending_deletion = true
  ', table_name_param, table_name_param);

  RETURN json_build_object(
    'success', true, 
    'message', format('Soft delete columns added to table %s', table_name_param)
  );
EXCEPTION WHEN others THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$;

-- Function to ensure all existing Protheus dynamic tables have soft delete columns
CREATE OR REPLACE FUNCTION public.ensure_soft_delete_on_all_protheus_tables()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  table_record RECORD;
  result_summary json;
  success_count integer := 0;
  error_count integer := 0;
  errors text[] := ARRAY[]::text[];
BEGIN
  -- Loop through all dynamic tables from protheus_dynamic_tables
  FOR table_record IN 
    SELECT supabase_table_name 
    FROM public.protheus_dynamic_tables 
    WHERE supabase_table_name IS NOT NULL
  LOOP
    BEGIN
      -- Add soft delete columns to each table
      PERFORM public.add_soft_delete_columns(table_record.supabase_table_name);
      success_count := success_count + 1;
    EXCEPTION WHEN others THEN
      error_count := error_count + 1;
      errors := errors || format('Table %s: %s', table_record.supabase_table_name, SQLERRM);
    END;
  END LOOP;

  result_summary := json_build_object(
    'success', true,
    'total_tables_processed', success_count + error_count,
    'successful_updates', success_count,
    'failed_updates', error_count,
    'errors', errors
  );

  RETURN result_summary;
END;
$$;

-- Execute the function to add soft delete columns to all existing Protheus tables
SELECT public.ensure_soft_delete_on_all_protheus_tables();