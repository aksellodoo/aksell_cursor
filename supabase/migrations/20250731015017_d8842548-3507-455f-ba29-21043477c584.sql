-- 1. Modificar o enum de confidentiality_level para ter apenas public e private
ALTER TYPE confidentiality_level RENAME TO confidentiality_level_old;
CREATE TYPE confidentiality_level AS ENUM ('public', 'private');

-- 2. Adicionar novas colunas à tabela workflows
ALTER TABLE public.workflows 
ADD COLUMN allowed_users UUID[] DEFAULT NULL,
ADD COLUMN allowed_departments UUID[] DEFAULT NULL,
ADD COLUMN allowed_roles TEXT[] DEFAULT NULL;

-- 3. Migrar dados existentes
UPDATE public.workflows 
SET confidentiality_level = 'public'::confidentiality_level
WHERE confidentiality_level::text = 'public';

UPDATE public.workflows 
SET confidentiality_level = 'private'::confidentiality_level
WHERE confidentiality_level::text IN ('department_leaders', 'directors_admins');

-- 4. Atualizar a coluna para usar o novo enum
ALTER TABLE public.workflows 
ALTER COLUMN confidentiality_level TYPE confidentiality_level 
USING confidentiality_level::text::confidentiality_level;

-- 5. Remover o enum antigo
DROP TYPE confidentiality_level_old;

-- 6. Atualizar a função can_access_workflow
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

-- 7. Atualizar as políticas RLS para usar a nova função
DROP POLICY IF EXISTS "Users can view workflows with confidentiality check" ON public.workflows;

CREATE POLICY "Users can view workflows with confidentiality check"
ON public.workflows
FOR SELECT
USING (can_access_workflow(confidentiality_level, id, auth.uid()));

-- 8. Aplicar as mesmas mudanças à tabela workflow_auto_triggers
DROP POLICY IF EXISTS "Users can view workflow auto triggers with confidentiality chec" ON public.workflow_auto_triggers;

CREATE POLICY "Users can view workflow auto triggers with confidentiality check"
ON public.workflow_auto_triggers
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM workflows w 
  WHERE w.id = workflow_auto_triggers.workflow_id 
  AND can_access_workflow(w.confidentiality_level, w.id, auth.uid())
));