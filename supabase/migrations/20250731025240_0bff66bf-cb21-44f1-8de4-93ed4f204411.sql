-- Corrigir warnings de segurança - adicionar search_path às funções

-- Recriar função para criar versão automaticamente com search_path
CREATE OR REPLACE FUNCTION public.create_form_version()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  -- Se o formulário já tem respostas e está sendo alterado, criar nova versão
  IF OLD.has_responses = true AND (
    OLD.title IS DISTINCT FROM NEW.title OR
    OLD.description IS DISTINCT FROM NEW.description OR
    OLD.fields_definition IS DISTINCT FROM NEW.fields_definition OR
    OLD.settings IS DISTINCT FROM NEW.settings
  ) THEN
    -- Criar versão da versão anterior
    INSERT INTO public.form_versions (
      form_id, version_number, title, description, fields_definition, 
      settings, created_by, is_current, response_count
    ) VALUES (
      OLD.id, OLD.version_number, OLD.title, OLD.description, 
      OLD.fields_definition, OLD.settings, OLD.created_by, false,
      (SELECT COUNT(*) FROM public.form_responses WHERE form_id = OLD.id)
    );
    
    -- Incrementar versão do formulário atual
    NEW.version_number = OLD.version_number + 1;
    NEW.has_responses = false;
    NEW.is_published = false;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recriar função para gerar hash de senha com search_path
CREATE OR REPLACE FUNCTION public.generate_password_hash(password text)
RETURNS text 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$$;

-- Recriar função para verificar senha com search_path
CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  RETURN hash = crypt(password, hash);
END;
$$;