-- Corrigir função can_access_form com search_path seguro
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
SET search_path TO ''
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