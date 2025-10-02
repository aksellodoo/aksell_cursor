-- Drop any existing problematic event triggers first
DO $$
DECLARE
  trigger_rec RECORD;
BEGIN
  -- Drop all event triggers that might be causing issues
  FOR trigger_rec IN 
    SELECT evtname FROM pg_event_trigger 
    WHERE evtname LIKE '%protheus%' OR evtname LIKE '%auto_setup%'
  LOOP
    EXECUTE 'DROP EVENT TRIGGER ' || quote_ident(trigger_rec.evtname);
  END LOOP;
  
  -- Drop problematic functions
  DROP FUNCTION IF EXISTS auto_setup_protheus_table() CASCADE;
END $$;

-- Create column_exists function for schema cache checks
CREATE OR REPLACE FUNCTION public.column_exists(schema_name text, table_name text, column_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  exists_result boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = schema_name 
      AND table_name = column_exists.table_name 
      AND column_name = column_exists.column_name
  ) INTO exists_result;
  
  RETURN exists_result;
END;
$function$;