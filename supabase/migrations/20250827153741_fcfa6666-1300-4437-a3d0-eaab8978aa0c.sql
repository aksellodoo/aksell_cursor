
-- Corrige a função public.query_dynamic_table que ainda usava "||" com strings em arrays
-- Assinatura alvo: (table_name_param text, search_term text, column_filters jsonb, limit_param integer, offset_param integer, order_fields text[])
CREATE OR REPLACE FUNCTION public.query_dynamic_table(
  table_name_param text,
  search_term text DEFAULT NULL::text,
  column_filters jsonb DEFAULT '{}'::jsonb,
  limit_param integer DEFAULT 50,
  offset_param integer DEFAULT 0,
  order_fields text[] DEFAULT NULL::text[]
)
RETURNS TABLE(total_count bigint, filtered_count bigint, data jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  sql_query       text;
  count_query     text;
  where_clause    text := '';
  filter_conditions text[] := '{}';
  search_conditions text[] := '{}';
  column_list     text;
  key_text        text;
  value_text      text;
  safe_table_name text;
  order_clause    text := '';
  esc_search      text;
BEGIN
  -- Validação do nome da tabela
  IF table_name_param IS NULL OR btrim(table_name_param) = '' THEN
    RAISE EXCEPTION 'Table name cannot be null or empty';
  END IF;

  IF table_name_param !~ '^[a-zA-Z0-9_-]+$' THEN
    RAISE EXCEPTION 'Invalid table name format';
  END IF;

  safe_table_name := table_name_param;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = safe_table_name
  ) THEN
    RAISE EXCEPTION 'Table % does not exist', safe_table_name;
  END IF;

  -- Lista de colunas preservando a ordem
  SELECT string_agg(format('%I', column_name), ', ' ORDER BY ordinal_position)
  INTO column_list
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = safe_table_name;

  -- Termo de busca (escapando % _ e \)
  IF search_term IS NOT NULL AND btrim(search_term) <> '' THEN
    esc_search := replace(replace(replace(search_term, '\', '\\'), '%', '\%'), '_', '\_');

    SELECT COALESCE(array_agg(
      format('%I::text ILIKE %L ESCAPE %L', column_name, '%' || esc_search || '%', '\')
    ), '{}')
    INTO search_conditions
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = safe_table_name
      AND data_type IN ('text', 'character varying', 'character');
  END IF;

  -- Filtros por coluna (também escapando)
  IF column_filters IS NOT NULL AND jsonb_typeof(column_filters) = 'object' THEN
    FOR key_text, value_text IN
      SELECT * FROM jsonb_each_text(column_filters)
    LOOP
      IF value_text IS NOT NULL AND btrim(value_text) <> '' THEN
        -- apenas se a coluna existir
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = safe_table_name
            AND column_name = key_text
        ) THEN
          value_text := replace(replace(replace(value_text, '\', '\\'), '%', '\%'), '_', '\_');
          filter_conditions := array_append(
            filter_conditions,
            format('%I::text ILIKE %L ESCAPE %L', key_text, '%' || value_text || '%', '\')
          );
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Monta WHERE
  IF COALESCE(array_length(search_conditions, 1), 0) > 0
     OR COALESCE(array_length(filter_conditions, 1), 0) > 0 THEN
    where_clause := ' WHERE ';

    IF COALESCE(array_length(search_conditions, 1), 0) > 0 THEN
      where_clause := where_clause || '(' || array_to_string(search_conditions, ' OR ') || ')';
    END IF;

    IF COALESCE(array_length(filter_conditions, 1), 0) > 0 THEN
      IF COALESCE(array_length(search_conditions, 1), 0) > 0 THEN
        where_clause := where_clause || ' AND ';
      END IF;
      where_clause := where_clause || array_to_string(filter_conditions, ' AND ');
    END IF;
  END IF;

  -- ORDER BY: usa o primeiro campo da tabela por padrão
  IF order_fields IS NOT NULL AND array_length(order_fields, 1) > 0 THEN
    order_clause := ' ORDER BY ' || array_to_string(order_fields, ', ');
  ELSE
    SELECT ' ORDER BY ' || format('%I', column_name)
    INTO order_clause
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = safe_table_name
    ORDER BY ordinal_position
    LIMIT 1;
  END IF;

  -- Contagem total
  sql_query := format('SELECT COUNT(*) FROM %I', safe_table_name);
  EXECUTE sql_query INTO total_count;

  -- Contagem filtrada
  count_query := format('SELECT COUNT(*) FROM %I%s', safe_table_name, where_clause);
  EXECUTE count_query INTO filtered_count;

  -- Consulta principal
  sql_query := format(
    'SELECT jsonb_agg(row_to_json(t)) FROM (SELECT %s FROM %I%s%s LIMIT %s OFFSET %s) t',
    column_list,
    safe_table_name,
    where_clause,
    order_clause,
    limit_param,
    offset_param
  );
  EXECUTE sql_query INTO data;

  IF data IS NULL THEN
    data := '[]'::jsonb;
  END IF;

  RETURN NEXT;
END;
$function$;
