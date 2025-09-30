-- Fix security issue: add proper search path to the function
DROP FUNCTION IF EXISTS public.update_protheus_tables_updated_at();

CREATE OR REPLACE FUNCTION public.update_protheus_tables_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;