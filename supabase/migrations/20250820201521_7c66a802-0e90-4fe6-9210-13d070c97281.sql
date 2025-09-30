-- Create function to ensure soft delete columns exist (simplified version)
CREATE OR REPLACE FUNCTION public.ensure_soft_delete_columns(p_table_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sql_cmd text;
BEGIN
  -- Build the ALTER TABLE command safely
  sql_cmd := format(
    'ALTER TABLE public.%I 
     ADD COLUMN IF NOT EXISTS pending_deletion BOOLEAN NOT NULL DEFAULT FALSE,
     ADD COLUMN IF NOT EXISTS pending_deletion_at TIMESTAMPTZ NULL',
    p_table_name
  );
  
  -- Execute the command
  EXECUTE sql_cmd;
  
  -- Create index safely
  sql_cmd := format(
    'CREATE INDEX IF NOT EXISTS %I ON public.%I (pending_deletion)',
    p_table_name || '_pending_deletion_idx',
    p_table_name
  );
  
  EXECUTE sql_cmd;
  
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
  sql_cmd text;
BEGIN
  -- Get deletions from protheus_sync_deletions for this table
  FOR deletion_record IN 
    SELECT protheus_id, created_at
    FROM public.protheus_sync_deletions 
    WHERE supabase_table_name = p_table_name
  LOOP
    -- Build update command safely
    sql_cmd := format(
      'UPDATE public.%I 
       SET pending_deletion = TRUE, 
           pending_deletion_at = %L
       WHERE protheus_id = %L',
      p_table_name,
      deletion_record.created_at,
      deletion_record.protheus_id
    );
    
    -- Execute update
    EXECUTE sql_cmd;
    
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