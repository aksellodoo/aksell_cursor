-- Corrigir warnings de segurança recriando função com SET search_path
DROP FUNCTION IF EXISTS public.update_protheus_dynamic_tables_updated_at() CASCADE;

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

-- Recriar trigger que foi removido com CASCADE
CREATE TRIGGER update_protheus_dynamic_tables_updated_at
BEFORE UPDATE ON public.protheus_dynamic_tables
FOR EACH ROW
EXECUTE FUNCTION public.update_protheus_dynamic_tables_updated_at();