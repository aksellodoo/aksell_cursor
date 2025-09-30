-- 1. Remover todas as políticas que dependem da coluna confidentiality_level
DROP POLICY IF EXISTS "Users can view workflows with confidentiality check" ON public.workflows;
DROP POLICY IF EXISTS "Users can update their workflows" ON public.workflows;
DROP POLICY IF EXISTS "Users can delete their workflows" ON public.workflows;
DROP POLICY IF EXISTS "Users can view workflow auto triggers with confidentiality chec" ON public.workflow_auto_triggers;

-- 2. Adicionar novas colunas à tabela workflows
ALTER TABLE public.workflows 
ADD COLUMN IF NOT EXISTS allowed_users UUID[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS allowed_departments UUID[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS allowed_roles TEXT[] DEFAULT NULL;

-- 3. Criar o novo enum
CREATE TYPE confidentiality_level_new AS ENUM ('public', 'private');

-- 4. Adicionar nova coluna temporária
ALTER TABLE public.workflows 
ADD COLUMN confidentiality_level_new confidentiality_level_new;

-- 5. Migrar dados existentes
UPDATE public.workflows 
SET confidentiality_level_new = 'public'::confidentiality_level_new
WHERE confidentiality_level::text = 'public';

UPDATE public.workflows 
SET confidentiality_level_new = 'private'::confidentiality_level_new
WHERE confidentiality_level::text IN ('department_leaders', 'directors_admins');

-- 6. Remover a coluna antiga e renomear
ALTER TABLE public.workflows DROP COLUMN confidentiality_level CASCADE;
ALTER TABLE public.workflows RENAME COLUMN confidentiality_level_new TO confidentiality_level;

-- 7. Renomear o enum
ALTER TYPE confidentiality_level_new RENAME TO confidentiality_level;

-- 8. Recriar a função can_access_workflow
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
  
  -- Caso padrão: negar acesso
  RETURN false;
END;
$function$;

-- 9. Recriar todas as políticas RLS
CREATE POLICY "Users can view workflows with confidentiality check"
ON public.workflows
FOR SELECT
USING (can_access_workflow(confidentiality_level, id, auth.uid()));

CREATE POLICY "Users can update their workflows"
ON public.workflows
FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Users can delete their workflows"
ON public.workflows
FOR DELETE
USING (created_by = auth.uid());

CREATE POLICY "Users can view workflow auto triggers with confidentiality check"
ON public.workflow_auto_triggers
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM workflows w 
  WHERE w.id = workflow_auto_triggers.workflow_id 
  AND can_access_workflow(w.confidentiality_level, w.id, auth.uid())
));