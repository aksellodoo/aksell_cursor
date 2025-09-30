-- 1. Migrar todos os formulários existentes para público
UPDATE public.forms 
SET confidentiality_level = 'public'
WHERE confidentiality_level = 'private';

-- 2. Criar função para verificar se usuário pode acessar formulário
CREATE OR REPLACE FUNCTION public.can_access_form(
  form_confidentiality confidentiality_level,
  form_allowed_users uuid[],
  form_allowed_departments uuid[],
  form_allowed_roles text[],
  user_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text;
  user_dept_id uuid;
  is_creator boolean;
BEGIN
  -- Buscar informações do usuário
  SELECT role, department_id INTO user_role, user_dept_id
  FROM public.profiles 
  WHERE id = user_id;
  
  -- Verificar se é o criador do formulário
  SELECT EXISTS(
    SELECT 1 FROM public.forms 
    WHERE created_by = user_id
  ) INTO is_creator;
  
  -- Administradores têm acesso total
  IF user_role IN ('admin', 'director') THEN
    RETURN true;
  END IF;
  
  -- Criadores têm acesso aos próprios formulários
  IF is_creator THEN
    RETURN true;
  END IF;
  
  -- Verificar acesso baseado no nível de confidencialidade
  CASE form_confidentiality
    WHEN 'public' THEN
      RETURN true;
    WHEN 'department_leaders' THEN
      SELECT is_leader INTO is_creator FROM public.profiles WHERE id = user_id;
      RETURN COALESCE(is_creator, false) OR user_role IN ('director', 'admin', 'hr');
    WHEN 'directors_admins' THEN
      RETURN user_role IN ('director', 'admin');
    WHEN 'private' THEN
      -- Verificar se usuário está nas listas permitidas
      IF user_id = ANY(COALESCE(form_allowed_users, ARRAY[]::uuid[])) THEN
        RETURN true;
      END IF;
      
      IF user_dept_id = ANY(COALESCE(form_allowed_departments, ARRAY[]::uuid[])) THEN
        RETURN true;
      END IF;
      
      IF user_role = ANY(COALESCE(form_allowed_roles, ARRAY[]::text[])) THEN
        RETURN true;
      END IF;
      
      RETURN false;
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- 3. Atualizar função can_access_workflow para dar acesso total aos admins
CREATE OR REPLACE FUNCTION public.can_access_workflow(workflow_confidentiality confidentiality_level, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text;
  is_user_leader boolean;
  is_creator boolean;
BEGIN
  -- Buscar role e status de liderança do usuário
  SELECT role, is_leader 
  INTO user_role, is_user_leader
  FROM public.profiles 
  WHERE id = user_id;
  
  -- Administradores têm acesso total
  IF user_role IN ('admin', 'director') THEN
    RETURN true;
  END IF;
  
  -- Verificar se é criador do workflow
  SELECT EXISTS(
    SELECT 1 FROM public.workflows 
    WHERE created_by = user_id
  ) INTO is_creator;
  
  -- Criadores têm acesso aos próprios workflows
  IF is_creator THEN
    RETURN true;
  END IF;
  
  -- Verificar acesso baseado no nível de confidencialidade
  CASE workflow_confidentiality
    WHEN 'public' THEN
      RETURN true;
    WHEN 'department_leaders' THEN
      RETURN is_user_leader = true OR user_role IN ('hr');
    WHEN 'directors_admins' THEN
      RETURN false; -- Já verificado acima
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- 4. Atualizar política RLS dos workflows para garantir que admins vejam tudo
DROP POLICY IF EXISTS "Users can view workflows with confidentiality check" ON public.workflows;
CREATE POLICY "Users can view workflows with confidentiality check" 
ON public.workflows 
FOR SELECT 
USING (
  can_access_workflow(confidentiality_level, auth.uid()) OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'director')
);

-- 5. Atualizar política RLS dos workflow_auto_triggers para admins
DROP POLICY IF EXISTS "Users can view workflow auto triggers with confidentiality chec" ON public.workflow_auto_triggers;
CREATE POLICY "Users can view workflow auto triggers with confidentiality check" 
ON public.workflow_auto_triggers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.workflows w
    WHERE w.id = workflow_auto_triggers.workflow_id 
    AND (
      can_access_workflow(w.confidentiality_level, auth.uid()) OR
      (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'director')
    )
  )
);