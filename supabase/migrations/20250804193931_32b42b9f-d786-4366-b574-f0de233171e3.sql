-- Corrigir warnings de segurança adicionando SET search_path
DROP FUNCTION IF EXISTS public.update_protheus_dynamic_tables_updated_at();

CREATE OR REPLACE FUNCTION public.update_protheus_dynamic_tables_updated_at()
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