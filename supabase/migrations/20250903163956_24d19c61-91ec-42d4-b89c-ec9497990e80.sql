-- Create an overloaded version of query_dynamic_table that handles the current parameter set properly
-- This ensures backward compatibility and fixes the RPC parameter errors

CREATE OR REPLACE FUNCTION public.query_dynamic_table(
  table_name_param text, 
  search_term text DEFAULT NULL::text, 
  column_filters jsonb DEFAULT NULL::jsonb, 
  sort_column text DEFAULT NULL::text, 
  sort_direction text DEFAULT 'asc'::text, 
  limit_param integer DEFAULT 50, 
  offset_param integer DEFAULT 0
) RETURNS TABLE(data jsonb, total_count integer)
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
  normalized_search_term text;
  filter_key text;
  filter_value text;
  normalized_filter_value text;
  v_total_count integer;
BEGIN
  -- Validate table name to prevent SQL injection
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = table_name_param
  ) THEN
    RAISE EXCEPTION 'Table % does not exist or is not accessible', table_name_param;
  END IF;

  -- Get all columns for this table
  SELECT array_agg(column_name ORDER BY ordinal_position)
  INTO v_columns_str
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = table_name_param;

  -- Build columns string for SELECT
  v_columns_str := array_to_string(
    ARRAY(SELECT format('%I', col) FROM unnest(string_to_array(array_to_string(v_columns_str, ','), ',')) AS col), 
    ', '
  );

  -- Get text columns for search
  SELECT array_agg(column_name)
  INTO text_columns
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = table_name_param
    AND data_type IN ('text', 'character varying', 'character');

  -- Get numeric columns for search
  SELECT array_agg(column_name)
  INTO numeric_columns
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = table_name_param
    AND data_type IN ('integer', 'bigint', 'smallint', 'numeric', 'real', 'double precision');

  -- Get date columns for search
  SELECT array_agg(column_name)
  INTO date_columns
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = table_name_param
    AND data_type IN ('date', 'timestamp without time zone', 'timestamp with time zone');

  -- Handle search term with normalization
  IF search_term IS NOT NULL AND trim(search_term) != '' THEN
    -- Normalize search term
    normalized_search_term := normalize_text(search_term);
    
    -- Search in text columns using normalized comparison
    IF text_columns IS NOT NULL AND array_length(text_columns, 1) > 0 THEN
      where_clauses := array_append(
        where_clauses,
        '(' || array_to_string(
          ARRAY(
            SELECT format('normalize_text(%I) ILIKE %L', c, '%' || normalized_search_term || '%')
            FROM unnest(text_columns) AS c
          ), 
          ' OR '
        ) || ')'
      );
    END IF;

    -- Search in numeric columns (if search term is numeric)
    IF numeric_columns IS NOT NULL AND array_length(numeric_columns, 1) > 0 AND search_term ~ '^[0-9]+\.?[0-9]*$' THEN
      where_clauses := array_append(
        where_clauses,
        '(' || array_to_string(
          ARRAY(
            SELECT format('normalize_text(%I::text) ILIKE %L', c, '%' || normalized_search_term || '%')
            FROM unnest(numeric_columns) AS c
          ), 
          ' OR '
        ) || ')'
      );
    END IF;

    -- Search in date columns (if search term looks like a date)
    IF date_columns IS NOT NULL AND array_length(date_columns, 1) > 0 AND (
      search_term ~ '^\d{4}-\d{2}-\d{2}' OR 
      search_term ~ '^\d{2}/\d{2}/\d{4}' OR
      search_term ~ '^\d{1,2}/\d{1,2}/\d{2,4}'
    ) THEN
      where_clauses := array_append(
        where_clauses,
        '(' || array_to_string(
          ARRAY(
            SELECT format('normalize_text(%I::text) ILIKE %L', c, '%' || normalized_search_term || '%')
            FROM unnest(date_columns) AS c
          ), 
          ' OR '
        ) || ')'
      );
    END IF;
  END IF;

  -- Handle column filters with normalization
  IF column_filters IS NOT NULL THEN
    FOR filter_key, filter_value IN
      SELECT * FROM jsonb_each_text(column_filters)
    LOOP
      IF filter_value IS NOT NULL AND trim(filter_value) != '' THEN
        -- Normalize filter value
        normalized_filter_value := normalize_text(filter_value);
        
        where_clauses := array_append(
          where_clauses,
          format('normalize_text(%I) ILIKE %L', filter_key, '%' || normalized_filter_value || '%')
        );
      END IF;
    END LOOP;
  END IF;

  -- Build WHERE clause
  IF array_length(where_clauses, 1) > 0 THEN
    v_where_clause := 'WHERE (' || array_to_string(where_clauses, ') AND (') || ')';
  END IF;

  -- Build count query
  v_count_query := format('SELECT COUNT(*) FROM %I %s', table_name_param, v_where_clause);
  
  -- Execute count query
  EXECUTE v_count_query INTO v_total_count;

  -- Build main query with ordering and pagination
  v_query := format('SELECT %s FROM %I %s', v_columns_str, table_name_param, v_where_clause);
  
  -- Add ordering
  IF sort_column IS NOT NULL AND sort_column != '' THEN
    v_query := v_query || format(' ORDER BY %I %s', sort_column, CASE WHEN sort_direction = 'desc' THEN 'DESC' ELSE 'ASC' END);
  END IF;
  
  -- Add pagination
  v_query := v_query || format(' LIMIT %s OFFSET %s', limit_param, offset_param);

  -- Return data with total count
  RETURN QUERY EXECUTE format('
    SELECT row_to_json(r) as data, %L::integer as total_count
    FROM (%s) r
  ', v_total_count, v_query);
  
END;
$function$;