-- Create function to ensure soft delete columns exist
CREATE OR REPLACE FUNCTION public.ensure_soft_delete_columns(p_table_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Add pending_deletion columns if they don't exist
  EXECUTE format(
    'ALTER TABLE public.%I 
     ADD COLUMN IF NOT EXISTS pending_deletion BOOLEAN NOT NULL DEFAULT FALSE,
     ADD COLUMN IF NOT EXISTS pending_deletion_at TIMESTAMPTZ NULL',
    p_table_name
  );
  
  -- Create index if it doesn't exist
  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS %I ON public.%I (pending_deletion)',
    p_table_name || '_pending_deletion_idx',
    p_table_name
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Soft delete columns ensured for table ' || p_table_name
  );
EXCEPTION WHEN others THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$;

-- Create function to backfill soft deletions
CREATE OR REPLACE FUNCTION public.backfill_soft_deletions_for_table(p_table_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deletion_record RECORD;
  backfilled_count INTEGER := 0;
BEGIN
  -- Get deletions from protheus_sync_deletions for this table
  FOR deletion_record IN 
    SELECT protheus_id, created_at
    FROM public.protheus_sync_deletions 
    WHERE supabase_table_name = p_table_name
  LOOP
    -- Update the record to mark as pending deletion
    EXECUTE format(
      'UPDATE public.%I 
       SET pending_deletion = TRUE, 
           pending_deletion_at = %L
       WHERE protheus_id = %L',
      p_table_name,
      deletion_record.created_at,
      deletion_record.protheus_id
    );
    
    -- Count successful updates
    IF FOUND THEN
      backfilled_count := backfilled_count + 1;
    END IF;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Backfilled ' || backfilled_count || ' deletions for table ' || p_table_name,
    'backfilled_count', backfilled_count
  );
EXCEPTION WHEN others THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'error_code', SQLSTATE,
    'backfilled_count', 0
  );
END;
$$;

-- Create orchestrator function that works with table ID
CREATE OR REPLACE FUNCTION public.ensure_soft_delete_for_table_by_id(p_table_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  table_name text;
  columns_result json;
  backfill_result json;
  total_backfilled INTEGER := 0;
BEGIN
  -- Get the supabase table name from table ID
  SELECT supabase_table_name INTO table_name
  FROM public.protheus_dynamic_tables
  WHERE id = p_table_id;
  
  IF table_name IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Table not found for ID: ' || p_table_id
    );
  END IF;
  
  -- Step 1: Ensure soft delete columns exist
  SELECT public.ensure_soft_delete_columns(table_name) INTO columns_result;
  
  IF NOT (columns_result->>'success')::boolean THEN
    RETURN columns_result;
  END IF;
  
  -- Step 2: Backfill deletions
  SELECT public.backfill_soft_deletions_for_table(table_name) INTO backfill_result;
  
  IF (backfill_result->>'success')::boolean THEN
    total_backfilled := (backfill_result->>'backfilled_count')::integer;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Soft delete setup completed for table ' || table_name,
    'table_name', table_name,
    'backfilled', total_backfilled,
    'columns_result', columns_result,
    'backfill_result', backfill_result
  );
EXCEPTION WHEN others THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.ensure_soft_delete_for_table_by_id(uuid) TO authenticated;