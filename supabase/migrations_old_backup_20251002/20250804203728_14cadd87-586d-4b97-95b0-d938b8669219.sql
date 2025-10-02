-- Criar função para operações DDL dinâmicas
CREATE OR REPLACE FUNCTION public.create_dynamic_table(table_definition text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Executar comando DDL
  EXECUTE table_definition;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Tabela criada com sucesso'
  );
EXCEPTION WHEN others THEN
  RETURN json_build_object(
    'success', false, 
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$;

-- Função para verificar se tabela existe
CREATE OR REPLACE FUNCTION public.table_exists(table_name_param text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = table_name_param
  );
$$;