-- Remover campo password_hash da tabela form_external_recipients
ALTER TABLE public.form_external_recipients DROP COLUMN IF EXISTS password_hash;

-- Criar função para gerar senhas seguras (12 caracteres)
CREATE OR REPLACE FUNCTION public.generate_secure_form_password()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Função para verificar se formulário pode ser acessado por usuário externo
CREATE OR REPLACE FUNCTION public.can_access_form(
  form_confidentiality confidentiality_level,
  form_allowed_users uuid[],
  form_allowed_departments uuid[],
  form_allowed_roles text[],
  user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_profile record;
BEGIN
  -- Se não há usuário (acesso anônimo), só pode acessar formulários públicos
  IF user_id IS NULL THEN
    RETURN form_confidentiality = 'public';
  END IF;
  
  -- Buscar perfil do usuário
  SELECT * INTO user_profile
  FROM public.profiles 
  WHERE id = user_id;
  
  -- Se usuário não encontrado, negar acesso
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Verificar acesso baseado no nível de confidencialidade
  CASE form_confidentiality
    WHEN 'public' THEN
      RETURN true;
    WHEN 'department_leaders' THEN
      RETURN user_profile.is_leader = true OR user_profile.role IN ('director', 'admin', 'hr');
    WHEN 'directors_admins' THEN
      RETURN user_profile.role IN ('director', 'admin');
    ELSE
      -- Para outros níveis, verificar listas específicas
      RETURN 
        (form_allowed_users IS NULL OR user_id = ANY(form_allowed_users)) OR
        (form_allowed_departments IS NULL OR user_profile.department_id = ANY(form_allowed_departments)) OR
        (form_allowed_roles IS NULL OR user_profile.role = ANY(form_allowed_roles));
  END CASE;
END;
$$;

-- Trigger para criar nova versão quando formulário com respostas é modificado
CREATE OR REPLACE FUNCTION public.handle_form_versioning()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Aplicar trigger de versionamento
DROP TRIGGER IF EXISTS trigger_form_versioning ON public.forms;
CREATE TRIGGER trigger_form_versioning
  BEFORE UPDATE ON public.forms
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_form_versioning();