-- Modificar tabela forms para sistema de confidencialidade como workflows
-- Adicionar colunas para controle de acesso granular
ALTER TABLE public.forms 
ADD COLUMN IF NOT EXISTS allowed_users uuid[],
ADD COLUMN IF NOT EXISTS allowed_departments uuid[],
ADD COLUMN IF NOT EXISTS allowed_roles text[];

-- Migrar dados existentes: is_public = true -> confidentiality_level = 'public'
-- is_public = false -> confidentiality_level = 'private'
UPDATE public.forms 
SET confidentiality_level = CASE 
  WHEN is_public = true THEN 'public'::confidentiality_level
  ELSE 'private'::confidentiality_level
END
WHERE confidentiality_level IS NULL OR confidentiality_level != 'public'::confidentiality_level;

-- Atualizar função para verificar acesso aos formulários
CREATE OR REPLACE FUNCTION public.can_access_form(form_confidentiality confidentiality_level, form_allowed_users uuid[], form_allowed_departments uuid[], form_allowed_roles text[], user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text;
  user_dept uuid;
  is_user_leader boolean;
BEGIN
  -- Buscar informações do usuário
  SELECT role, department_id, is_leader 
  INTO user_role, user_dept, is_user_leader
  FROM public.profiles 
  WHERE id = user_id;
  
  -- Verificar acesso baseado no nível de confidencialidade
  CASE form_confidentiality
    WHEN 'public' THEN
      RETURN true; -- Qualquer usuário autenticado pode ver
    WHEN 'private' THEN
      -- Verificar se está na lista de usuários permitidos
      IF user_id = ANY(form_allowed_users) THEN
        RETURN true;
      END IF;
      
      -- Verificar se está em departamento permitido
      IF user_dept = ANY(form_allowed_departments) THEN
        RETURN true;
      END IF;
      
      -- Verificar se tem role permitida
      IF user_role = ANY(form_allowed_roles) THEN
        RETURN true;
      END IF;
      
      RETURN false;
    WHEN 'department_leaders' THEN
      RETURN is_user_leader = true OR user_role IN ('director', 'admin', 'hr');
    WHEN 'directors_admins' THEN
      RETURN user_role IN ('director', 'admin');
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- Atualizar política RLS para usar nova função
DROP POLICY IF EXISTS "Users can view forms with confidentiality check" ON public.forms;

CREATE POLICY "Users can view forms with confidentiality check" 
ON public.forms 
FOR SELECT 
USING (
  can_access_form(
    confidentiality_level, 
    allowed_users, 
    allowed_departments, 
    allowed_roles, 
    auth.uid()
  )
);