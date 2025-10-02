
-- RPC seguro para remoção de tabelas dinâmicas
CREATE OR REPLACE FUNCTION public.drop_dynamic_table(p_table_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_table_name IS NULL OR btrim(p_table_name) = '' THEN
    RETURN json_build_object('success', false, 'error', 'table_name é obrigatório');
  END IF;

  -- Permitir apenas nomes com letras minúsculas, números e underscore
  IF p_table_name !~ '^[a-z0-9_]+$' THEN
    RETURN json_build_object('success', false, 'error', 'Nome de tabela inválido');
  END IF;

  -- Dropar tabela com identificação segura
  EXECUTE format('DROP TABLE IF EXISTS public.%I', p_table_name);

  RETURN json_build_object('success', true, 'message', format('Tabela %s removida', p_table_name));
EXCEPTION WHEN others THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$function$;
