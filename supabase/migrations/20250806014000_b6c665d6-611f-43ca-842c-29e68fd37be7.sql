-- Criar função RPC simples para consultar tabelas dinâmicas
CREATE OR REPLACE FUNCTION public.query_dynamic_table(
  table_name text,
  search_term text DEFAULT '',
  column_filters jsonb DEFAULT '{}',
  page_limit integer DEFAULT 50,
  page_offset integer DEFAULT 0,
  count_only boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sql_query text;
  where_conditions text[] := '{}';
  result_data jsonb;
  total_count integer;
BEGIN
  -- Validar nome da tabela para prevenir SQL injection
  IF table_name !~ '^[a-zA-Z_][a-zA-Z0-9_]*$' THEN
    RAISE EXCEPTION 'Nome de tabela inválido';
  END IF;
  
  -- Construir condições WHERE
  IF search_term != '' THEN
    where_conditions := array_append(where_conditions, 
      format('(a1_cod ILIKE %L OR a1_nome ILIKE %L OR a1_cgc ILIKE %L)', 
        '%' || search_term || '%', '%' || search_term || '%', '%' || search_term || '%'));
  END IF;
  
  -- Adicionar filtros de coluna
  IF column_filters != '{}' THEN
    FOR column_name, filter_value IN SELECT * FROM jsonb_each_text(column_filters)
    LOOP
      IF filter_value != '' THEN
        where_conditions := array_append(where_conditions, 
          format('%I ILIKE %L', column_name, '%' || filter_value || '%'));
      END IF;
    END LOOP;
  END IF;
  
  -- Se é apenas contagem
  IF count_only THEN
    sql_query := format('SELECT COUNT(*) FROM %I', table_name);
    IF array_length(where_conditions, 1) > 0 THEN
      sql_query := sql_query || ' WHERE ' || array_to_string(where_conditions, ' AND ');
    END IF;
    
    EXECUTE sql_query INTO total_count;
    RETURN jsonb_build_object('count', total_count);
  END IF;
  
  -- Query principal com dados
  sql_query := format('SELECT * FROM %I', table_name);
  
  IF array_length(where_conditions, 1) > 0 THEN
    sql_query := sql_query || ' WHERE ' || array_to_string(where_conditions, ' AND ');
  END IF;
  
  sql_query := sql_query || format(' ORDER BY created_at DESC LIMIT %s OFFSET %s', 
    page_limit, page_offset);
  
  -- Executar query e retornar dados como JSONB
  EXECUTE format('SELECT jsonb_agg(row_to_json(t)) FROM (%s) t', sql_query) INTO result_data;
  
  RETURN COALESCE(result_data, '[]'::jsonb);
END;
$$;