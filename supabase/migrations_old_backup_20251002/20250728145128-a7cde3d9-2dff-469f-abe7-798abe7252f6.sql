-- Remover trigger primeiro para poder modificar a função
DROP TRIGGER IF EXISTS chatter_files_versioning_trigger ON public.chatter_files;

-- Recriar função com search_path correto
CREATE OR REPLACE FUNCTION public.handle_chatter_file_versioning()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_group_id uuid;
  max_version integer;
BEGIN
  -- Se é um novo upload para o mesmo record + descrição, é uma nova versão
  IF NEW.document_group_id IS NULL THEN
    -- Procurar por grupo existente com mesma descrição
    SELECT document_group_id INTO existing_group_id
    FROM public.chatter_files 
    WHERE record_type = NEW.record_type 
      AND record_id = NEW.record_id 
      AND description = NEW.description 
      AND id != NEW.id
    LIMIT 1;
    
    IF existing_group_id IS NOT NULL THEN
      -- É uma nova versão de documento existente
      NEW.document_group_id := existing_group_id;
      
      -- Marcar versões anteriores como não atuais
      UPDATE public.chatter_files 
      SET is_current_version = false 
      WHERE document_group_id = existing_group_id;
      
      -- Calcular novo número de versão
      SELECT COALESCE(MAX(version_number), 0) + 1 INTO max_version
      FROM public.chatter_files 
      WHERE document_group_id = existing_group_id;
      
      NEW.version_number := max_version;
      NEW.is_current_version := true;
    ELSE
      -- É um documento completamente novo
      NEW.document_group_id := gen_random_uuid();
      NEW.version_number := 1;
      NEW.is_current_version := true;
    END IF;
  END IF;
  
  -- Se requer aprovação, definir status como pending
  IF NEW.requires_approval = true AND NEW.approval_status IS NULL THEN
    NEW.approval_status := 'pending';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recriar trigger
CREATE TRIGGER chatter_files_versioning_trigger
  BEFORE INSERT ON public.chatter_files
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_chatter_file_versioning();