-- Corrigir função query_dynamic_table para resolver erro array_to_string
CREATE OR REPLACE FUNCTION public.query_dynamic_table(
  p_table_id uuid,
  p_columns text[] DEFAULT NULL,
  p_where_conditions text DEFAULT NULL,
  p_order_by text DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_table_name text;
  v_columns_list text[];
  v_columns_str text;
  v_query text;
  v_count_query text;
  v_result jsonb;
  v_total_count integer;
  v_column_info jsonb;
  rec record;
BEGIN
  -- Buscar nome da tabela
  SELECT supabase_table_name INTO v_table_name
  FROM protheus_dynamic_tables
  WHERE protheus_table_id = p_table_id;

  IF v_table_name IS NULL THEN
    RAISE EXCEPTION 'Tabela não encontrada para ID: %', p_table_id;
  END IF;

  -- Se colunas específicas foram fornecidas, usar elas
  IF p_columns IS NOT NULL AND array_length(p_columns, 1) > 0 THEN
    v_columns_list := p_columns;
  ELSE
    -- Buscar todas as colunas da tabela
    SELECT array_agg(column_name ORDER BY ordinal_position)
    INTO v_columns_list
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = v_table_name
      AND column_name NOT IN ('id', 'created_at', 'updated_at');
  END IF;

  -- Construir string de colunas
  v_columns_str := array_to_string(v_columns_list, ', ');

  -- Construir query de contagem
  v_count_query := 'SELECT COUNT(*) FROM ' || quote_ident(v_table_name);
  IF p_where_conditions IS NOT NULL AND p_where_conditions != '' THEN
    v_count_query := v_count_query || ' WHERE ' || p_where_conditions;
  END IF;

  -- Executar contagem
  EXECUTE v_count_query INTO v_total_count;

  -- Construir query principal
  v_query := 'SELECT ' || v_columns_str || ' FROM ' || quote_ident(v_table_name);
  
  IF p_where_conditions IS NOT NULL AND p_where_conditions != '' THEN
    v_query := v_query || ' WHERE ' || p_where_conditions;
  END IF;
  
  IF p_order_by IS NOT NULL AND p_order_by != '' THEN
    v_query := v_query || ' ORDER BY ' || p_order_by;
  END IF;
  
  v_query := v_query || ' LIMIT ' || p_limit || ' OFFSET ' || p_offset;

  -- Obter informações das colunas para metadados
  SELECT jsonb_object_agg(
    column_name,
    jsonb_build_object(
      'data_type', data_type,
      'is_nullable', is_nullable = 'YES',
      'ordinal_position', ordinal_position
    )
  ) INTO v_column_info
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = v_table_name
    AND column_name = ANY(v_columns_list);

  -- Executar query e construir resultado
  v_result := jsonb_build_object(
    'data', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT * FROM (
          EXECUTE v_query
        ) as query_result
      ) t
    ),
    'total_count', v_total_count,
    'columns', v_column_info,
    'query_info', jsonb_build_object(
      'table_name', v_table_name,
      'limit', p_limit,
      'offset', p_offset,
      'where_conditions', COALESCE(p_where_conditions, ''),
      'order_by', COALESCE(p_order_by, '')
    )
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao executar query na tabela %: %', v_table_name, SQLERRM;
END;
$function$;