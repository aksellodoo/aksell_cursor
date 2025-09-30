-- Fix search path for generate_relationship_name function
DROP FUNCTION IF EXISTS generate_relationship_name(TEXT, TEXT);

CREATE OR REPLACE FUNCTION generate_relationship_name(source_table_name TEXT, target_table_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN UPPER(source_table_name || '_' || target_table_name);
END;
$$;