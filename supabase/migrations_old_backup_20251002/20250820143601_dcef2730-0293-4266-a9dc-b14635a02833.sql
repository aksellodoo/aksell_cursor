-- Fix the existing trigger function and implement soft delete functionality

-- First, fix the existing auto_setup_protheus_table function that has a column name error
CREATE OR REPLACE FUNCTION public.auto_setup_protheus_table()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    obj record;
BEGIN
    -- Get information about newly created tables in public schema starting with 'protheus_'
    FOR obj IN
        SELECT schema_name, object_identity
        FROM pg_event_trigger_ddl_commands()
        WHERE object_type = 'table'
          AND schema_name = 'public'
          AND object_identity LIKE 'public.protheus_%'
    LOOP
        -- Log the table creation
        INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
        VALUES (
            gen_random_uuid(),
            'auto_protheus_table_setup',
            NULL,
            obj.object_identity,
            COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
            'system'
        );
    END LOOP;
END;
$$;

-- Now implement the soft delete functionality

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