-- Add columns to protheus_table_extra_fields to track application to Supabase
ALTER TABLE public.protheus_table_extra_fields 
ADD COLUMN applied_to_supabase BOOLEAN DEFAULT NULL;

ALTER TABLE public.protheus_table_extra_fields 
ADD COLUMN applied_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create RPC function to execute SQL (for ALTER TABLE operations)
CREATE OR REPLACE FUNCTION public.execute_sql(sql_statement text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate that the statement is ALTER TABLE
  IF sql_statement !~* '^ALTER TABLE' THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Apenas comandos ALTER TABLE são permitidos'
    );
  END IF;

  -- Execute the SQL statement
  EXECUTE sql_statement;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Comando executado com sucesso'
  );
EXCEPTION WHEN others THEN
  RETURN json_build_object(
    'success', false, 
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$function$;