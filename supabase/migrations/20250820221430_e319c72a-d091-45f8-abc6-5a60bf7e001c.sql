-- 1) Create utility function to check if column exists
CREATE OR REPLACE FUNCTION public.column_exists(
  p_schema_name text,
  p_table_name text, 
  p_column_name text
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = p_schema_name 
      AND table_name = p_table_name 
      AND column_name = p_column_name
  );
$$;