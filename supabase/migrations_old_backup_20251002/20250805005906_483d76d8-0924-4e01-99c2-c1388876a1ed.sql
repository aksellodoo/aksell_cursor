-- Atualizar função exec_sql para retornar dados das queries SELECT
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  result json;
  query_result record;
  results_array json[];
BEGIN
  -- Validar que não é uma query perigosa
  IF sql_query ~* '(drop\s+|delete\s+|truncate\s+|alter\s+user|grant\s+|revoke\s+)' THEN
    RAISE EXCEPTION 'Operação não permitida para segurança';
  END IF;
  
  -- Se for uma query SELECT, retornar os dados
  IF sql_query ~* '^\s*select' THEN
    BEGIN
      -- Executar a query e coletar resultados
      FOR query_result IN EXECUTE sql_query LOOP
        results_array := array_append(results_array, to_json(query_result));
      END LOOP;
      
      -- Retornar array de resultados
      RETURN array_to_json(results_array);
    EXCEPTION WHEN others THEN
      RETURN json_build_object('success', false, 'error', SQLERRM);
    END;
  ELSE
    -- Para outras queries, executar sem retornar dados
    BEGIN
      EXECUTE sql_query;
      result := json_build_object('success', true, 'message', 'SQL executado com sucesso');
    EXCEPTION WHEN others THEN
      result := json_build_object('success', false, 'error', SQLERRM);
    END;
    
    RETURN result;
  END IF;
END;
$function$;