-- Criar função execute_sql para permitir execução de SQL dinâmico
CREATE OR REPLACE FUNCTION public.execute_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  EXECUTE query;
END;
$function$;