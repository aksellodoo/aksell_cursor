-- Fix malformed array literal error in query_dynamic_table function
CREATE OR REPLACE FUNCTION public.query_dynamic_table(
  p_table_name text,
  p_columns text[] DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_search_term text DEFAULT NULL,
  p_column_filters jsonb DEFAULT NULL,
  p_sort_column text DEFAULT NULL,
  p_sort_direction text DEFAULT 'asc'
)
RETURNS TABLE(data jsonb, total_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_query text;
  v_count_query text;
  v_columns_str text;
  v_where_clause text := '';
  where_clauses text[] := '{}';
  text_columns text[];
  numeric_columns text[];
  date_columns text[];
  escaped_search_term text;
  filter_key text;
  filter_value text;
  v_total_count integer;
BEGIN
  -- Validate table name to prevent SQL injection
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = p_table_name
  ) THEN
    RAISE EXCEPTION 'Table % does not exist or is not accessible', p_table_name;
  END IF;

  -- Get column info if columns not specified
  IF p_columns IS NULL THEN
    SELECT array_agg(column_name ORDER BY ordinal_position)
    INTO p_columns
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = p_table_name;
  END IF;

  -- Build columns string
  v_columns_str := array_to_string(
    ARRAY(SELECT format('%I', col) FROM unnest(p_columns) AS col), 
    ', '
  );

  -- Get text columns for search
  SELECT array_agg(column_name)
  INTO text_columns
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = p_table_name
    AND data_type IN ('text', 'character varying', 'character');

  -- Get numeric columns for search
  SELECT array_agg(column_name)
  INTO numeric_columns
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = p_table_name
    AND data_type IN ('integer', 'bigint', 'smallint', 'numeric', 'real', 'double precision');

  -- Get date columns for search
  SELECT array_agg(column_name)
  INTO date_columns
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = p_table_name
    AND data_type IN ('date', 'timestamp without time zone', 'timestamp with time zone');

  -- Handle search term
  IF p_search_term IS NOT NULL AND trim(p_search_term) != '' THEN
    -- Escape special characters for ILIKE with ESCAPE
    escaped_search_term := p_search_term;
    escaped_search_term := replace(escaped_search_term, '\', '\\');
    escaped_search_term := replace(escaped_search_term, '%', '\%');
    escaped_search_term := replace(escaped_search_term, '_', '\_');
    escaped_search_term := replace(escaped_search_term, '''', '''''');
    
    -- Search in text columns
    IF text_columns IS NOT NULL AND array_length(text_columns, 1) > 0 THEN
      where_clauses := array_append(
        where_clauses,
        '(' || array_to_string(
          ARRAY(
            SELECT format('%I ILIKE %L ESCAPE %L', c, '%' || escaped_search_term || '%', '\')
            FROM unnest(text_columns) AS c
          ), 
          ' OR '
        ) || ')'
      );
    END IF;

    -- Search in numeric columns (if search term is numeric)
    IF numeric_columns IS NOT NULL AND array_length(numeric_columns, 1) > 0 AND p_search_term ~ '^[0-9]+\.?[0-9]*$' THEN
      where_clauses := array_append(
        where_clauses,
        '(' || array_to_string(
          ARRAY(
            SELECT format('%I::text ILIKE %L ESCAPE %L', c, '%' || escaped_search_term || '%', '\')
            FROM unnest(numeric_columns) AS c
          ), 
          ' OR '
        ) || ')'
      );
    END IF;

    -- Search in date columns (if search term looks like a date)
    IF date_columns IS NOT NULL AND array_length(date_columns, 1) > 0 AND (
      p_search_term ~ '^\d{4}-\d{2}-\d{2}' OR 
      p_search_term ~ '^\d{2}/\d{2}/\d{4}' OR
      p_search_term ~ '^\d{1,2}/\d{1,2}/\d{2,4}'
    ) THEN
      where_clauses := array_append(
        where_clauses,
        '(' || array_to_string(
          ARRAY(
            SELECT format('%I::text ILIKE %L ESCAPE %L', c, '%' || escaped_search_term || '%', '\')
            FROM unnest(date_columns) AS c
          ), 
          ' OR '
        ) || ')'
      );
    END IF;
  END IF;

  -- Handle column filters
  IF p_column_filters IS NOT NULL THEN
    FOR filter_key, filter_value IN
      SELECT * FROM jsonb_each_text(p_column_filters)
    LOOP
      IF filter_value IS NOT NULL AND trim(filter_value) != '' THEN
        -- Escape the filter value
        filter_value := replace(filter_value, '\', '\\');
        filter_value := replace(filter_value, '%', '\%');
        filter_value := replace(filter_value, '_', '\_');
        filter_value := replace(filter_value, '''', '''''');
        
        where_clauses := array_append(
          where_clauses,
          format('%I ILIKE %L ESCAPE %L', filter_key, '%' || filter_value || '%', '\')
        );
      END IF;
    END LOOP;
  END IF;

  -- Build WHERE clause
  IF array_length(where_clauses, 1) > 0 THEN
    v_where_clause := ' WHERE (' || array_to_string(where_clauses, ') AND (') || ')';
  END IF;

  -- Build count query
  v_count_query := format('SELECT COUNT(*) FROM %I%s', p_table_name, v_where_clause);

  -- Execute count query
  EXECUTE v_count_query INTO v_total_count;

  -- Build main query with sorting and pagination
  v_query := format(
    'SELECT row_to_json(t) FROM (SELECT %s FROM %I%s',
    v_columns_str,
    p_table_name,
    v_where_clause
  );

  -- Add sorting
  IF p_sort_column IS NOT NULL THEN
    v_query := v_query || format(
      ' ORDER BY %I %s',
      p_sort_column,
      CASE WHEN lower(p_sort_direction) = 'desc' THEN 'DESC' ELSE 'ASC' END
    );
  END IF;

  -- Add pagination
  v_query := v_query || format(' LIMIT %s OFFSET %s', p_limit, p_offset);
  v_query := v_query || ') t';

  -- Return results
  RETURN QUERY EXECUTE format('
    SELECT 
      COALESCE(jsonb_agg(row_data), ''[]''::jsonb) as data,
      %s as total_count
    FROM (%s) as subquery(row_data)',
    v_total_count,
    v_query
  );
END;
$function$;