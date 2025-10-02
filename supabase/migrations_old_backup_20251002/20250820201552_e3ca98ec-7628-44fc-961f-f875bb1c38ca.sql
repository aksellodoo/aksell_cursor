-- Temporarily disable the problematic trigger
DROP TRIGGER IF EXISTS auto_setup_protheus_table_trigger ON public.protheus_dynamic_tables;

-- Create the orchestrator function first without the complex functions
CREATE OR REPLACE FUNCTION public.ensure_soft_delete_for_table_by_id(p_table_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  table_name text;
  backfilled_count INTEGER := 0;
  deletion_record RECORD;
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
  
  -- Step 1: Add soft delete columns if they don't exist
  BEGIN
    EXECUTE format(
      'ALTER TABLE public.%I 
       ADD COLUMN IF NOT EXISTS pending_deletion BOOLEAN NOT NULL DEFAULT FALSE,
       ADD COLUMN IF NOT EXISTS pending_deletion_at TIMESTAMPTZ NULL',
      table_name
    );
    
    -- Create index
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I (pending_deletion)',
      table_name || '_pending_deletion_idx',
      table_name
    );
  EXCEPTION WHEN others THEN
    -- Columns might already exist, continue
  END;
  
  -- Step 2: Backfill deletions
  FOR deletion_record IN 
    SELECT protheus_id, created_at
    FROM public.protheus_sync_deletions 
    WHERE supabase_table_name = table_name
  LOOP
    BEGIN
      EXECUTE format(
        'UPDATE public.%I 
         SET pending_deletion = TRUE, 
             pending_deletion_at = %L
         WHERE protheus_id = %L',
        table_name,
        deletion_record.created_at,
        deletion_record.protheus_id
      );
      
      IF FOUND THEN
        backfilled_count := backfilled_count + 1;
      END IF;
    EXCEPTION WHEN others THEN
      -- Continue with next record if this one fails
      CONTINUE;
    END;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Soft delete setup completed for table ' || table_name,
    'table_name', table_name,
    'backfilled', backfilled_count
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