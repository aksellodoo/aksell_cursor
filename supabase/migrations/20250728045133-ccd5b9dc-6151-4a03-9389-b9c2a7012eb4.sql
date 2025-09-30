-- Criar tabelas do sistema de tarefas e workflows

-- Tabela principal de tarefas
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES public.profiles(id),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_hours NUMERIC,
  actual_hours NUMERIC,
  tags TEXT[],
  record_type TEXT, -- 'user', 'department', 'employee', etc.
  record_id UUID, -- ID do registro relacionado
  workflow_id UUID, -- Referência ao workflow que gerou esta tarefa
  workflow_step_id TEXT, -- ID do step no workflow
  is_workflow_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de workflows (templates de processo)
CREATE TABLE public.workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  workflow_definition JSONB NOT NULL DEFAULT '{}', -- Definição visual do workflow (nodes, edges)
  is_active BOOLEAN NOT NULL DEFAULT true,
  trigger_type TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'automatic', 'scheduled')),
  trigger_conditions JSONB DEFAULT '{}', -- Condições para execução automática
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de dependências entre tarefas
CREATE TABLE public.task_dependencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL DEFAULT 'finish_to_start' CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, depends_on_task_id)
);

-- Tabela de templates de tarefas (para reutilização)
CREATE TABLE public.task_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  estimated_hours NUMERIC,
  default_priority TEXT NOT NULL DEFAULT 'medium' CHECK (default_priority IN ('low', 'medium', 'high', 'urgent')),
  tags TEXT[],
  checklist JSONB DEFAULT '[]', -- Lista de itens do checklist
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de histórico de tarefas (para auditoria)
CREATE TABLE public.task_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID NOT NULL REFERENCES public.profiles(id),
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de comentários de tarefas
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  comment TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT true,
  mentioned_users UUID[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de anexos de tarefas
CREATE TABLE public.task_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de execuções de workflow
CREATE TABLE public.workflow_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  triggered_by UUID REFERENCES public.profiles(id),
  trigger_data JSONB DEFAULT '{}',
  record_type TEXT,
  record_id UUID,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tasks
CREATE POLICY "Users can view tasks they are involved in" ON public.tasks 
FOR SELECT USING (
  auth.uid() = assigned_to OR 
  auth.uid() = created_by OR
  true -- Por enquanto permitir visualização geral, depois restringir por departamento/permissões
);

CREATE POLICY "Users can create tasks" ON public.tasks 
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update tasks they are involved in" ON public.tasks 
FOR UPDATE USING (
  auth.uid() = assigned_to OR 
  auth.uid() = created_by OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'hr', 'director'))
);

CREATE POLICY "Users can delete tasks they created" ON public.tasks 
FOR DELETE USING (
  auth.uid() = created_by OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'hr', 'director'))
);

-- Políticas RLS para workflows
CREATE POLICY "Users can view workflows" ON public.workflows 
FOR SELECT USING (true);

CREATE POLICY "Users can create workflows" ON public.workflows 
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their workflows" ON public.workflows 
FOR UPDATE USING (
  auth.uid() = created_by OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'hr', 'director'))
);

CREATE POLICY "Users can delete their workflows" ON public.workflows 
FOR DELETE USING (
  auth.uid() = created_by OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'hr', 'director'))
);

-- Políticas RLS para task_dependencies
CREATE POLICY "Users can view task dependencies" ON public.task_dependencies 
FOR SELECT USING (true);

CREATE POLICY "Users can manage task dependencies" ON public.task_dependencies 
FOR ALL USING (true);

-- Políticas RLS para task_templates
CREATE POLICY "Users can view task templates" ON public.task_templates 
FOR SELECT USING (true);

CREATE POLICY "Users can create task templates" ON public.task_templates 
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their task templates" ON public.task_templates 
FOR UPDATE USING (
  auth.uid() = created_by OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'hr', 'director'))
);

CREATE POLICY "Users can delete their task templates" ON public.task_templates 
FOR DELETE USING (
  auth.uid() = created_by OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'hr', 'director'))
);

-- Políticas RLS para task_history
CREATE POLICY "Users can view task history" ON public.task_history 
FOR SELECT USING (true);

CREATE POLICY "System can insert task history" ON public.task_history 
FOR INSERT WITH CHECK (true);

-- Políticas RLS para task_comments
CREATE POLICY "Users can view task comments" ON public.task_comments 
FOR SELECT USING (true);

CREATE POLICY "Users can create task comments" ON public.task_comments 
FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their task comments" ON public.task_comments 
FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their task comments" ON public.task_comments 
FOR DELETE USING (
  auth.uid() = author_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'hr', 'director'))
);

-- Políticas RLS para task_attachments
CREATE POLICY "Users can view task attachments" ON public.task_attachments 
FOR SELECT USING (true);

CREATE POLICY "Users can upload task attachments" ON public.task_attachments 
FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their task attachments" ON public.task_attachments 
FOR DELETE USING (
  auth.uid() = uploaded_by OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'hr', 'director'))
);

-- Políticas RLS para workflow_executions
CREATE POLICY "Users can view workflow executions" ON public.workflow_executions 
FOR SELECT USING (true);

CREATE POLICY "System can manage workflow executions" ON public.workflow_executions 
FOR ALL USING (true);

-- Trigger para atualizar updated_at nas tasks
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar updated_at nos workflows
CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar updated_at nos task_templates
CREATE TRIGGER update_task_templates_updated_at
  BEFORE UPDATE ON public.task_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar updated_at nos task_comments
CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para auditoria de mudanças em tarefas
CREATE OR REPLACE FUNCTION public.audit_task_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Track status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.task_history (task_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'status', OLD.status, NEW.status, auth.uid());
  END IF;

  -- Track assigned_to changes
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO public.task_history (task_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'assigned_to', 
      (SELECT name FROM public.profiles WHERE id = OLD.assigned_to),
      (SELECT name FROM public.profiles WHERE id = NEW.assigned_to),
      auth.uid());
  END IF;

  -- Track priority changes
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO public.task_history (task_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'priority', OLD.priority, NEW.priority, auth.uid());
  END IF;

  -- Track due_date changes
  IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
    INSERT INTO public.task_history (task_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'due_date', OLD.due_date::TEXT, NEW.due_date::TEXT, auth.uid());
  END IF;

  -- Mark as completed when status changes to done
  IF OLD.status != 'done' AND NEW.status = 'done' AND NEW.completed_at IS NULL THEN
    NEW.completed_at = now();
  END IF;

  -- Clear completed_at when status changes from done to something else
  IF OLD.status = 'done' AND NEW.status != 'done' THEN
    NEW.completed_at = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para auditoria de mudanças em tarefas
CREATE TRIGGER audit_task_changes_trigger
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_task_changes();

-- Índices para performance
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_record ON public.tasks(record_type, record_id);
CREATE INDEX idx_tasks_workflow ON public.tasks(workflow_id);
CREATE INDEX idx_task_history_task_id ON public.task_history(task_id);
CREATE INDEX idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX idx_task_attachments_task_id ON public.task_attachments(task_id);