-- Criar tabela para mapear triggers automáticos
CREATE TABLE IF NOT EXISTS public.workflow_auto_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para logs de triggers automáticos
CREATE TABLE IF NOT EXISTS public.workflow_trigger_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  execution_id UUID,
  status TEXT NOT NULL DEFAULT 'triggered',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.workflow_auto_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_trigger_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para workflow_auto_triggers
CREATE POLICY "Users can view workflow auto triggers with confidentiality check" 
ON public.workflow_auto_triggers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.workflows w 
    WHERE w.id = workflow_auto_triggers.workflow_id 
    AND can_access_workflow(w.confidentiality_level, auth.uid())
  )
);

CREATE POLICY "Users can create workflow auto triggers" 
ON public.workflow_auto_triggers 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workflows w 
    WHERE w.id = workflow_auto_triggers.workflow_id 
    AND w.created_by = auth.uid()
  )
);

CREATE POLICY "Users can update their workflow auto triggers" 
ON public.workflow_auto_triggers 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.workflows w 
    WHERE w.id = workflow_auto_triggers.workflow_id 
    AND w.created_by = auth.uid()
  )
);

CREATE POLICY "Users can delete their workflow auto triggers" 
ON public.workflow_auto_triggers 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.workflows w 
    WHERE w.id = workflow_auto_triggers.workflow_id 
    AND w.created_by = auth.uid()
  )
);

-- Políticas RLS para workflow_trigger_logs
CREATE POLICY "Users can view workflow trigger logs" 
ON public.workflow_trigger_logs 
FOR SELECT 
USING (true);

CREATE POLICY "System can create workflow trigger logs" 
ON public.workflow_trigger_logs 
FOR INSERT 
WITH CHECK (true);

-- Função para processar triggers automáticos
CREATE OR REPLACE FUNCTION public.process_workflow_triggers(
  p_trigger_type TEXT,
  p_trigger_data JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (workflow_id UUID, execution_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  trigger_rec RECORD;
  new_execution_id UUID;
BEGIN
  -- Buscar workflows com triggers automáticos ativos para o tipo especificado
  FOR trigger_rec IN 
    SELECT wat.workflow_id, wat.trigger_config
    FROM public.workflow_auto_triggers wat
    JOIN public.workflows w ON w.id = wat.workflow_id
    WHERE wat.trigger_type = p_trigger_type
      AND wat.is_active = true
      AND w.is_active = true
      AND w.deleted_at IS NULL
  LOOP
    -- Criar nova execução
    INSERT INTO public.workflow_executions (workflow_id, trigger_data, status)
    VALUES (trigger_rec.workflow_id, p_trigger_data, 'pending')
    RETURNING id INTO new_execution_id;
    
    -- Log do trigger
    INSERT INTO public.workflow_trigger_logs (
      workflow_id, 
      trigger_type, 
      trigger_data, 
      execution_id,
      status
    )
    VALUES (
      trigger_rec.workflow_id,
      p_trigger_type,
      p_trigger_data,
      new_execution_id,
      'triggered'
    );
    
    -- Atualizar timestamp do último trigger
    UPDATE public.workflow_auto_triggers 
    SET last_triggered_at = now()
    WHERE workflow_id = trigger_rec.workflow_id 
      AND trigger_type = p_trigger_type;
    
    -- Retornar resultado
    workflow_id := trigger_rec.workflow_id;
    execution_id := new_execution_id;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Trigger para detectar mudanças de status em tarefas
CREATE OR REPLACE FUNCTION public.trigger_task_status_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Processar triggers de mudança de status
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.process_workflow_triggers(
      'status_change',
      jsonb_build_object(
        'task_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'assigned_to', NEW.assigned_to,
        'changed_at', now()
      )
    );
  END IF;
  
  -- Processar triggers de tarefa completada
  IF OLD.status != 'done' AND NEW.status = 'done' THEN
    PERFORM public.process_workflow_triggers(
      'task_completed',
      jsonb_build_object(
        'task_id', NEW.id,
        'assigned_to', NEW.assigned_to,
        'completed_at', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger na tabela tasks
DROP TRIGGER IF EXISTS trigger_workflow_task_changes ON public.tasks;
CREATE TRIGGER trigger_workflow_task_changes
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_task_status_change();

-- Trigger para detectar criação de registros
CREATE OR REPLACE FUNCTION public.trigger_record_created()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Processar triggers de registro criado para diferentes tabelas
  PERFORM public.process_workflow_triggers(
    'record_created',
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'record_id', NEW.id,
      'created_by', COALESCE(NEW.created_by, auth.uid()),
      'created_at', now()
    )
  );
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger para criação de tarefas
DROP TRIGGER IF EXISTS trigger_workflow_task_created ON public.tasks;
CREATE TRIGGER trigger_workflow_task_created
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_record_created();

-- Aplicar trigger para criação de perfis (novos usuários)
DROP TRIGGER IF EXISTS trigger_workflow_profile_created ON public.profiles;
CREATE TRIGGER trigger_workflow_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_record_created();