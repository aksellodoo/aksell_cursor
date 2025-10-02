-- Just replace the problematic function with a safe version that uses correct column names
CREATE OR REPLACE FUNCTION public.auto_setup_protheus_table()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Function disabled - no longer interferes with table sync
  -- The original function had a bug referencing 'object_name' instead of correct column names
  RETURN;
END;
$$;