-- Drop and recreate the query_dynamic_table function to work with actual table structure
DROP FUNCTION IF EXISTS public.query_dynamic_table(text, text, jsonb, integer, integer, text[]);

CREATE OR REPLACE FUNCTION public.query_dynamic_table(
  table_name_param text, 
  search_term text DEFAULT NULL, 
  column_filters jsonb DEFAULT '{}', 
  limit_param integer DEFAULT 50, 
  offset_param integer DEFAULT 0, 
  column_order text[] DEFAULT NULL
)
RETURNS TABLE(data jsonb, total_count bigint)
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
  column_list text;
BEGIN
  -- Validate table name to prevent SQL injection
  IF table_name_param !~ '^[a-zA-Z0-9_]+$' THEN
    RAISE EXCEPTION 'Invalid table name: %', table_name_param;
  END IF;

  -- Check if table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = table_name_param
  ) THEN
    RAISE EXCEPTION 'Table % does not exist', table_name_param;
  END IF;

  -- Get all columns from the table dynamically
  SELECT string_agg(column_name, ', ')
  INTO column_list
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = table_name_param
    AND column_name NOT IN ('created_at', 'updated_at', 'record_hash', 'is_new_record')
  ORDER BY ordinal_position;

  -- Build search conditions (search across all text columns)
  IF search_term IS NOT NULL AND search_term != '' THEN
    SELECT string_agg(
      format('%I::text ILIKE ''%%%s%%''', column_name, search_term),
      ' OR '
    )
    INTO search_conditions
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = table_name_param
      AND data_type IN ('text', 'character varying', 'character');
    
    IF search_conditions IS NOT NULL THEN
      search_conditions := 'AND (' || search_conditions || ')';
    END IF;
  END IF;

  -- Build column filter conditions
  IF column_filters != '{}' THEN
    SELECT string_agg(
      format('AND %I::text ILIKE ''%%%s%%''', key, value),
      ' '
    )
    INTO filter_conditions
    FROM jsonb_each_text(column_filters)
    WHERE value IS NOT NULL AND value != '';
  END IF;

  -- Build order clause based on column_order parameter or default to id if exists
  IF column_order IS NOT NULL AND array_length(column_order, 1) > 0 THEN
    SELECT string_agg(
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
            AND table_name = table_name_param 
            AND column_name = col
        ) THEN format('%I', col)
        ELSE NULL
      END,
      ', '
    )
    INTO order_clause
    FROM unnest(column_order) AS col
    WHERE EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = table_name_param 
        AND column_name = col
    );
  END IF;
  
  IF order_clause IS NULL OR order_clause = '' THEN
    -- Try to order by id if exists, otherwise by first column
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = table_name_param 
        AND column_name = 'id'
    ) THEN
      order_clause := 'id';
    ELSE
      SELECT column_name INTO order_clause
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = table_name_param
      ORDER BY ordinal_position
      LIMIT 1;
    END IF;
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

  -- Main query - build JSON object from all columns
  sql_query := format(
    'SELECT row_to_json(t.*) as data, %s as total_count 
     FROM (
       SELECT %s
       FROM %I 
       WHERE 1=1 %s %s 
       ORDER BY %s 
       LIMIT %s OFFSET %s
     ) t',
    total_records,
    column_list,
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