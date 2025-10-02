-- Fix security issue: drop trigger and function, then recreate with proper search path
DROP TRIGGER IF EXISTS update_protheus_tables_updated_at ON public.protheus_tables;
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

CREATE TRIGGER update_protheus_tables_updated_at
BEFORE UPDATE ON public.protheus_tables
FOR EACH ROW
EXECUTE FUNCTION public.update_protheus_tables_updated_at();