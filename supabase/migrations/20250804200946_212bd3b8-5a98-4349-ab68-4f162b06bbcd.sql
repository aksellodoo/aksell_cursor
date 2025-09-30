-- Corrigir função exec_sql para resolver warnings de segurança
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  result json;
BEGIN
  -- Validar que não é uma query perigosa
  IF sql_query ~* '(drop\s+|delete\s+|truncate\s+|alter\s+user|grant\s+|revoke\s+)' THEN
    RAISE EXCEPTION 'Operação não permitida para segurança';
  END IF;
  
  -- Executar a query e retornar resultado
  BEGIN
    EXECUTE sql_query;
    result := json_build_object('success', true, 'message', 'SQL executado com sucesso');
  EXCEPTION WHEN others THEN
    result := json_build_object('success', false, 'error', SQLERRM);
  END;
  
  RETURN result;
END;
$function$;