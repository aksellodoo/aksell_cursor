-- Fix query_dynamic_table function to maintain field order
CREATE OR REPLACE FUNCTION query_dynamic_table(
  table_name_param text,
  search_term text DEFAULT NULL,
  column_filters jsonb DEFAULT '{}'::jsonb,
  limit_param integer DEFAULT 50,
  offset_param integer DEFAULT 0,
  column_order text[] DEFAULT NULL
)
RETURNS TABLE(
  data jsonb,
  total_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_query text;
  count_query text;
  filter_conditions text := '';
  search_conditions text := '';
  order_clause text := '';
  total_records bigint;
BEGIN
  -- Validate table name to prevent SQL injection
  IF table_name_param !~ '^[a-zA-Z0-9_]+$' THEN
    RAISE EXCEPTION 'Invalid table name: %', table_name_param;
  END IF;

  -- Build search conditions
  IF search_term IS NOT NULL AND search_term != '' THEN
    search_conditions := format('AND (data::text ILIKE ''%%%s%%'')', search_term);
  END IF;

  -- Build column filter conditions
  IF column_filters != '{}'::jsonb THEN
    SELECT string_agg(
      format('AND (data->>''%s'')::text ILIKE ''%%%s%%''', key, value),
      ' '
    )
    INTO filter_conditions
    FROM jsonb_each_text(column_filters)
    WHERE value IS NOT NULL AND value != '';
  END IF;

  -- Build order clause based on column_order parameter
  IF column_order IS NOT NULL AND array_length(column_order, 1) > 0 THEN
    order_clause := format('ORDER BY %s', array_to_string(
      array(
        SELECT CASE 
          WHEN col = 'id' THEN 'id'
          ELSE format('(data->>''%s'')', col)
        END
        FROM unnest(column_order) AS col
      ), 
      ', '
    ));
  ELSE
    order_clause := 'ORDER BY id';
  END IF;

  -- Count query
  count_query := format(
    'SELECT COUNT(*) FROM %I WHERE 1=1 %s %s',
    table_name_param,
    COALESCE(search_conditions, ''),
    COALESCE(filter_conditions, '')
  );

  -- Execute count query
  EXECUTE count_query INTO total_records;

  -- Main query with proper field ordering
  sql_query := format(
    'SELECT jsonb_build_object(''id'', id) || data as data, %s as total_count 
     FROM %I 
     WHERE 1=1 %s %s 
     %s 
     LIMIT %s OFFSET %s',
    total_records,
    table_name_param,
    COALESCE(search_conditions, ''),
    COALESCE(filter_conditions, ''),
    order_clause,
    limit_param,
    offset_param
  );

  -- Execute main query and return results
  RETURN QUERY EXECUTE sql_query;
END;
$$;