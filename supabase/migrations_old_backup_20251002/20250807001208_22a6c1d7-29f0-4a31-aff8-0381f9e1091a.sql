-- Modify create_dynamic_table function to support ALTER TABLE commands for constraints
CREATE OR REPLACE FUNCTION public.create_dynamic_table(table_definition text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Validar que o comando é CREATE TABLE ou ALTER TABLE para constraints
  IF table_definition !~* '^(CREATE TABLE|ALTER TABLE .* ADD CONSTRAINT .* UNIQUE)' THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Apenas comandos CREATE TABLE e ALTER TABLE para constraints UNIQUE são permitidos'
    );
  END IF;

  -- Executar comando DDL
  EXECUTE table_definition;
  
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