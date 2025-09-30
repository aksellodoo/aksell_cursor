-- Corrigir a lógica de versionamento para manter a nova versão publicada
-- e despublicar apenas a versão anterior

CREATE OR REPLACE FUNCTION public.create_form_version()
RETURNS TRIGGER AS $$
DECLARE
  current_version INTEGER;
BEGIN
  -- Verificar se o formulário já tem respostas e está sendo alterado
  IF NEW.has_responses = true AND OLD.has_responses = true AND 
     (OLD.title IS DISTINCT FROM NEW.title OR 
      OLD.description IS DISTINCT FROM NEW.description OR 
      OLD.fields_definition IS DISTINCT FROM NEW.fields_definition OR 
      OLD.settings IS DISTINCT FROM NEW.settings) THEN
    
    -- Obter o número da versão atual
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO current_version
    FROM public.form_versions 
    WHERE form_id = OLD.id;
    
    -- Salvar a versão anterior (despublicada) em form_versions
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
    ) VALUES (
      OLD.id,
      current_version - 1,
      OLD.title,
      OLD.description,
      OLD.fields_definition,
      OLD.settings,
      OLD.created_by,
      (SELECT COUNT(*) FROM public.form_responses WHERE form_id = OLD.id),
      false
    );
    
    -- Atualizar o número da versão do formulário atual
    NEW.version_number := current_version;
    
    -- A nova versão permanece publicada (não alterar status)
    -- Resetar contador de respostas para a nova versão
    NEW.has_responses := false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';