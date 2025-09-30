-- Drop the existing function first
DROP FUNCTION IF EXISTS public.query_dynamic_table(text, text, jsonb, integer, integer, boolean);

-- Create simplified query_dynamic_table function with correct parameters
CREATE OR REPLACE FUNCTION public.query_dynamic_table(
  table_name_param text,
  search_term text DEFAULT '',
  column_filters jsonb DEFAULT '{}',
  limit_param integer DEFAULT 50,
  offset_param integer DEFAULT 0,
  count_only boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  query_text text;
  result jsonb;
  total_count integer;
  where_clause text := '';
BEGIN
  -- Validate table name to prevent SQL injection
  IF table_name_param !~ '^[a-zA-Z][a-zA-Z0-9_]*$' THEN
    RAISE EXCEPTION 'Invalid table name: %', table_name_param;
  END IF;

  -- Check if table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = table_name_param
  ) THEN
    RAISE EXCEPTION 'Table does not exist: %', table_name_param;
  END IF;

  -- Build simple WHERE clause for search only
  IF search_term IS NOT NULL AND length(trim(search_term)) > 0 THEN
    where_clause := format(' WHERE CAST(%I AS text) ILIKE %L', 
                          'protheus_id', 
                          '%' || trim(search_term) || '%');
  END IF;

  -- If only counting, return count
  IF count_only THEN
    query_text := format('SELECT COUNT(*) FROM %I%s', table_name_param, where_clause);
    EXECUTE query_text INTO total_count;
    RETURN jsonb_build_object('count', total_count);
  END IF;

  -- Get total count for pagination
  query_text := format('SELECT COUNT(*) FROM %I%s', table_name_param, where_clause);
  EXECUTE query_text INTO total_count;

  -- Build main query with simple ordering by first column
  query_text := format(
    'SELECT json_agg(row_to_json(t.*)) FROM (SELECT * FROM %I%s ORDER BY %I LIMIT %s OFFSET %s) t',
    table_name_param,
    where_clause,
    'id', -- Simple ordering by id
    limit_param,
    offset_param
  );

  -- Execute query
  EXECUTE query_text INTO result;

  -- Return result with metadata
  RETURN jsonb_build_object(
    'data', COALESCE(result, '[]'::jsonb),
    'total_count', total_count,
    'limit', limit_param,
    'offset', offset_param
  );

EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Error executing query: %', SQLERRM;
END;
$$;