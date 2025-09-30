-- Corrigir função para gerar senhas seguras com search_path seguro
CREATE OR REPLACE FUNCTION public.generate_secure_form_password()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Corrigir função de versionamento com search_path seguro
CREATE OR REPLACE FUNCTION public.handle_form_versioning()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  max_version integer;
BEGIN
  -- Se o formulário tem respostas e está sendo modificado (exceto campos específicos)
  IF OLD.has_responses = true AND (
    OLD.title IS DISTINCT FROM NEW.title OR
    OLD.description IS DISTINCT FROM NEW.description OR
    OLD.fields_definition IS DISTINCT FROM NEW.fields_definition OR
    OLD.settings IS DISTINCT FROM NEW.settings
  ) THEN
    -- Encontrar próximo número de versão
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO max_version
    FROM public.form_versions 
    WHERE form_id = OLD.id;
    
    -- Criar nova versão com os dados antigos
    INSERT INTO public.form_versions (
      form_id, 
      version_number, 
      title, 
      description, 
      fields_definition, 
      settings,
      created_by,
      response_count,
      is_current
    ) 
    SELECT 
      OLD.id,
      OLD.version_number,
      OLD.title,
      OLD.description, 
      OLD.fields_definition,
      OLD.settings,
      OLD.created_by,
      (SELECT COUNT(*) FROM public.form_responses WHERE form_id = OLD.id),
      false;
    
    -- Atualizar formulário principal com nova versão
    NEW.version_number := max_version;
    NEW.has_responses := false; -- Resetar para nova versão
    NEW.publication_status := 'draft'; -- Nova versão começa como rascunho
    NEW.is_published := false;
  END IF;
  
  RETURN NEW;
END;
$$;