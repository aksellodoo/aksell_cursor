-- 1. Adicionar apenas as novas colunas à tabela workflows
ALTER TABLE public.workflows 
ADD COLUMN IF NOT EXISTS allowed_users UUID[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS allowed_departments UUID[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS allowed_roles TEXT[] DEFAULT NULL;

-- 2. Atualizar workflows existentes: privados ficam como 'public' por padrão
-- (usuário pode configurar depois)
UPDATE public.workflows 
SET confidentiality_level = 'public'
WHERE confidentiality_level IN ('department_leaders', 'directors_admins');

-- 3. Recriar a função can_access_workflow para trabalhar com a nova lógica
CREATE OR REPLACE FUNCTION public.can_access_workflow(workflow_confidentiality confidentiality_level, workflow_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role text;
  user_dept uuid;
  workflow_data record;
BEGIN
  -- Buscar role e departamento do usuário
  SELECT role, department_id 
  INTO user_role, user_dept
  FROM public.profiles 
  WHERE id = user_id;
  
  -- Se o workflow é público, qualquer usuário pode acessar
  IF workflow_confidentiality = 'public' THEN
    RETURN true;
  END IF;
  
  -- Se o workflow é privado, verificar permissões específicas
  IF workflow_confidentiality = 'private' THEN
    -- Buscar dados do workflow
    SELECT w.created_by, w.allowed_users, w.allowed_departments, w.allowed_roles
    INTO workflow_data
    FROM public.workflows w
    WHERE w.id = workflow_id;
    
    -- Criador sempre pode acessar
    IF workflow_data.created_by = user_id THEN
      RETURN true;
    END IF;
    
    -- Verificar se usuário está na lista de usuários permitidos
    IF workflow_data.allowed_users IS NOT NULL AND user_id = ANY(workflow_data.allowed_users) THEN
      RETURN true;
    END IF;
    
    -- Verificar se departamento do usuário está na lista de departamentos permitidos
    IF workflow_data.allowed_departments IS NOT NULL AND user_dept = ANY(workflow_data.allowed_departments) THEN
      RETURN true;
    END IF;
    
    -- Verificar se role do usuário está na lista de roles permitidas
    IF workflow_data.allowed_roles IS NOT NULL AND user_role = ANY(workflow_data.allowed_roles) THEN
      RETURN true;
    END IF;
    
    -- Se nenhuma condição foi atendida, negar acesso
    RETURN false;
  END IF;
  
  -- Para outros níveis (department_leaders, directors_admins), usar lógica antiga temporariamente
  -- Esta será removida quando migrarmos completamente para public/private
  DECLARE
    is_user_leader boolean;
  BEGIN
    SELECT is_leader INTO is_user_leader FROM public.profiles WHERE id = user_id;
    
    CASE workflow_confidentiality
      WHEN 'department_leaders' THEN
        RETURN is_user_leader = true OR user_role IN ('director', 'admin', 'hr');
      WHEN 'directors_admins' THEN
        RETURN user_role IN ('director', 'admin');
      ELSE
        RETURN false;
    END CASE;
  END;
END;
$function$;