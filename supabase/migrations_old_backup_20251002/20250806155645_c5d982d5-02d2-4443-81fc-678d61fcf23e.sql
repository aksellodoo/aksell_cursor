-- Drop and recreate query_dynamic_table function to fix GROUP BY error
DROP FUNCTION IF EXISTS public.query_dynamic_table(text, text, jsonb, integer, integer, text[]);

CREATE OR REPLACE FUNCTION public.query_dynamic_table(
  table_name_param text,
  search_term text DEFAULT NULL,
  column_filters jsonb DEFAULT '{}'::jsonb,
  limit_param integer DEFAULT 50,
  offset_param integer DEFAULT 0,
  order_fields text[] DEFAULT NULL
)
RETURNS TABLE(
  total_count bigint,
  filtered_count bigint,
  data jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sql_query text;
  count_query text;
  where_clause text := '';
  filter_conditions text[] := '{}';
  search_conditions text[] := '{}';
  column_list text;
  key_text text;
  value_text text;
  safe_table_name text;
  order_clause text := '';
BEGIN
  -- Validate and sanitize table name
  IF table_name_param IS NULL OR table_name_param = '' THEN
    RAISE EXCEPTION 'Table name cannot be null or empty';
  END IF;
  
  -- Simple validation - only allow alphanumeric, underscore, and dash
  IF table_name_param !~ '^[a-zA-Z0-9_-]+$' THEN
    RAISE EXCEPTION 'Invalid table name format';
  END IF;
  
  safe_table_name := table_name_param;
  
  -- Check if table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = safe_table_name
  ) THEN
    RAISE EXCEPTION 'Table % does not exist', safe_table_name;
  END IF;
  
  -- Get column list dynamically - FIX: Move ORDER BY inside string_agg
  SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
  INTO column_list
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = safe_table_name
    AND column_name NOT IN ('created_at', 'updated_at');
  
  -- Build search conditions
  IF search_term IS NOT NULL AND search_term != '' THEN
    -- Get text columns for search
    SELECT array_agg(
      format('%I::text ILIKE %L', column_name, '%' || search_term || '%')
    )
    INTO search_conditions
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = safe_table_name
      AND data_type IN ('text', 'character varying', 'character')
      AND column_name NOT IN ('created_at', 'updated_at');
  END IF;
  
  -- Build column filters
  IF column_filters IS NOT NULL AND jsonb_typeof(column_filters) = 'object' THEN
    FOR key_text, value_text IN
      SELECT * FROM jsonb_each_text(column_filters)
    LOOP
      IF value_text IS NOT NULL AND value_text != '' THEN
        -- Validate column exists
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' 
            AND table_name = safe_table_name
            AND column_name = key_text
        ) THEN
          filter_conditions := filter_conditions || 
            format('%I::text ILIKE %L', key_text, '%' || value_text || '%');
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  -- Combine conditions
  IF array_length(search_conditions, 1) > 0 OR array_length(filter_conditions, 1) > 0 THEN
    where_clause := ' WHERE ';
    
    IF array_length(search_conditions, 1) > 0 THEN
      where_clause := where_clause || '(' || array_to_string(search_conditions, ' OR ') || ')';
    END IF;
    
    IF array_length(filter_conditions, 1) > 0 THEN
      IF array_length(search_conditions, 1) > 0 THEN
        where_clause := where_clause || ' AND ';
      END IF;
      where_clause := where_clause || array_to_string(filter_conditions, ' AND ');
    END IF;
  END IF;
  
  -- Build ORDER BY clause
  IF order_fields IS NOT NULL AND array_length(order_fields, 1) > 0 THEN
    order_clause := ' ORDER BY ' || array_to_string(order_fields, ', ');
  ELSE
    -- Default ordering by first column
    SELECT ' ORDER BY ' || column_name
    INTO order_clause
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = safe_table_name
      AND column_name NOT IN ('created_at', 'updated_at')
    ORDER BY ordinal_position
    LIMIT 1;
  END IF;
  
  -- Get total count
  sql_query := format('SELECT COUNT(*) FROM %I', safe_table_name);
  EXECUTE sql_query INTO total_count;
  
  -- Get filtered count
  count_query := format('SELECT COUNT(*) FROM %I%s', safe_table_name, where_clause);
  EXECUTE count_query INTO filtered_count;
  
  -- Build main query
  sql_query := format(
    'SELECT jsonb_agg(row_to_json(t)) FROM (SELECT %s FROM %I%s%s LIMIT %s OFFSET %s) t',
    column_list,
    safe_table_name,
    where_clause,
    order_clause,
    limit_param,
    offset_param
  );
  
  -- Execute and return
  EXECUTE sql_query INTO data;
  
  -- Handle null result
  IF data IS NULL THEN
    data := '[]'::jsonb;
  END IF;
  
  RETURN NEXT;
END;
$$;