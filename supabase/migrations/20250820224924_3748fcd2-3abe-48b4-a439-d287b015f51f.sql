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