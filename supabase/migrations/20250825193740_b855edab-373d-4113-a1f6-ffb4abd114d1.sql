-- Criar enum para os 12 tipos fixos de tarefas
CREATE TYPE public.fixed_task_type AS ENUM (
  'approval',
  'signature', 
  'form',
  'review',
  'simple_task',
  'call',
  'email',
  'meeting',
  'import_file',
  'update_file',
  'document_delivery',
  'workflow'
);

-- Adicionar colunas à tabela tasks
ALTER TABLE public.tasks 
ADD COLUMN fixed_type public.fixed_task_type NOT NULL DEFAULT 'simple_task',
ADD COLUMN payload jsonb NOT NULL DEFAULT '{}';

-- Backfill para tarefas existentes
UPDATE public.tasks 
SET fixed_type = 'simple_task', payload = '{}'
WHERE fixed_type IS NULL OR payload IS NULL;

-- Criar tabela de templates
CREATE TABLE public.task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  fixed_type public.fixed_task_type NOT NULL,
  department_id uuid REFERENCES public.departments(id),
  default_assignee_id uuid,
  default_sla_hours integer,
  default_checklist text[],
  required_attachments text[],
  default_payload jsonb NOT NULL DEFAULT '{}',
  allowed_users uuid[],
  allowed_departments uuid[],
  allowed_roles text[],
  confidentiality_level public.confidentiality_level NOT NULL DEFAULT 'public',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_task_templates_fixed_type ON public.task_templates(fixed_type);
CREATE INDEX idx_task_templates_department ON public.task_templates(department_id);
CREATE INDEX idx_task_templates_active ON public.task_templates(is_active) WHERE is_active = true;
CREATE INDEX idx_tasks_fixed_type ON public.tasks(fixed_type);
CREATE INDEX idx_tasks_payload ON public.tasks USING GIN(payload);
CREATE INDEX idx_task_templates_default_payload ON public.task_templates USING GIN(default_payload);
CREATE INDEX idx_task_templates_required_attachments ON public.task_templates USING GIN(required_attachments);

-- Função para verificar acesso a templates
CREATE OR REPLACE FUNCTION public.can_access_task_template(
  p_confidentiality_level public.confidentiality_level,
  p_allowed_users uuid[],
  p_allowed_departments uuid[],
  p_allowed_roles text[],
  p_user_id uuid
) RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_department_id uuid;
  user_role text;
BEGIN
  -- Se público, todos podem acessar
  IF p_confidentiality_level = 'public' THEN
    RETURN true;
  END IF;
  
  -- Se sem user_id, negar acesso para templates não-públicos
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Buscar departamento e role do usuário
  SELECT department_id, role INTO user_department_id, user_role
  FROM public.profiles 
  WHERE id = p_user_id;
  
  -- Verificar se usuário está na lista de usuários permitidos
  IF p_allowed_users IS NOT NULL AND p_user_id = ANY(p_allowed_users) THEN
    RETURN true;
  END IF;
  
  -- Verificar se departamento do usuário está na lista de departamentos permitidos
  IF p_allowed_departments IS NOT NULL AND user_department_id = ANY(p_allowed_departments) THEN
    RETURN true;
  END IF;
  
  -- Verificar se role do usuário está na lista de roles permitidas
  IF p_allowed_roles IS NOT NULL AND user_role = ANY(p_allowed_roles) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- RLS para task_templates
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

-- Política de SELECT - usuários podem ver templates conforme permissões
CREATE POLICY "Users can view accessible templates" ON public.task_templates
FOR SELECT 
USING (
  is_active = true AND 
  can_access_task_template(
    confidentiality_level,
    allowed_users,
    allowed_departments, 
    allowed_roles,
    auth.uid()
  )
);

-- Política de INSERT - usuários autenticados podem criar templates
CREATE POLICY "Authenticated users can create templates" ON public.task_templates
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- Política de UPDATE - criadores podem atualizar seus templates
CREATE POLICY "Template creators can update" ON public.task_templates
FOR UPDATE 
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Política de DELETE - criadores podem deletar seus templates
CREATE POLICY "Template creators can delete" ON public.task_templates
FOR DELETE 
USING (auth.uid() = created_by);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_task_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_task_templates_updated_at
  BEFORE UPDATE ON public.task_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_task_template_updated_at();