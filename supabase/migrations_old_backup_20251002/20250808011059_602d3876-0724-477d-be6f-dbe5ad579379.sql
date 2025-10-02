-- Create or replace RPC to query dynamic Protheus tables with server-side filtering, sorting and pagination
CREATE OR REPLACE FUNCTION public.query_dynamic_table(
  table_name_param text,
  search_term text DEFAULT '',
  column_filters jsonb DEFAULT '{}'::jsonb,
  limit_param integer DEFAULT 50,
  offset_param integer DEFAULT 0,
  sort_by text DEFAULT NULL,
  sort_dir text DEFAULT 'asc',
  count_only boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sql_where text := '';
  sql_order text := '';
  total_count bigint := 0;
  result_rows jsonb := '[]'::jsonb;
  allowed_columns text[];
  text_columns text[];
  filter_key text;
  filter_val text;
  where_clauses text[] := ARRAY[]::text[];
  is_desc boolean := lower(sort_dir) = 'desc';
BEGIN
  -- Ensure user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('data', '[]'::jsonb, 'total_count', 0);
  END IF;

  -- Whitelist columns from information_schema
  SELECT array_agg(column_name::text) INTO allowed_columns
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = table_name_param;

  IF allowed_columns IS NULL THEN
    RETURN json_build_object('data', '[]'::jsonb, 'total_count', 0);
  END IF;

  -- Identify text-like columns for full-text-ish search
  SELECT array_agg(column_name::text) INTO text_columns
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = table_name_param
    AND data_type IN ('text', 'character varying', 'character', 'uuid');

  -- Global search across text columns
  IF search_term IS NOT NULL AND btrim(search_term) <> '' AND text_columns IS NOT NULL THEN
    where_clauses := where_clauses || '(' ||
      array_to_string(ARRAY(
        SELECT format('%I ILIKE %L', c, '%' || search_term || '%') FROM unnest(text_columns) AS c
      ), ' OR ')
    || ')';
  END IF;

  -- Column filters (substring match, case-insensitive)
  IF column_filters IS NOT NULL THEN
    FOR filter_key, filter_val IN
      SELECT key, value::text FROM jsonb_each_text(column_filters)
    LOOP
      IF filter_key = ANY(allowed_columns) AND filter_val IS NOT NULL AND btrim(filter_val) <> '' THEN
        where_clauses := where_clauses || format('%I ILIKE %L', filter_key, '%' || filter_val || '%');
      END IF;
    END LOOP;
  END IF;

  IF array_length(where_clauses,1) IS NOT NULL THEN
    sql_where := ' WHERE ' || array_to_string(where_clauses, ' AND ');
  END IF;

  -- Order by whitelisted column if provided
  IF sort_by IS NOT NULL AND sort_by = ANY(allowed_columns) THEN
    sql_order := format(' ORDER BY %I %s', sort_by, CASE WHEN is_desc THEN 'DESC' ELSE 'ASC' END);
  ELSE
    sql_order := '';
  END IF;

  -- Total count with same filters
  EXECUTE format('SELECT COUNT(*) FROM %I%s', table_name_param, sql_where) INTO total_count;

  IF count_only THEN
    RETURN json_build_object('data', '[]'::jsonb, 'total_count', total_count);
  END IF;

  -- Fetch rows as JSONB array
  EXECUTE format(
    'SELECT COALESCE(jsonb_agg(to_jsonb(t)), ''[]''::jsonb)
     FROM (SELECT * FROM %I%s%s LIMIT %s OFFSET %s) t',
    table_name_param,
    sql_where,
    sql_order,
    GREATEST(limit_param,0),
    GREATEST(offset_param,0)
  ) INTO result_rows;

  RETURN json_build_object('data', result_rows, 'total_count', total_count);
END;
$$;