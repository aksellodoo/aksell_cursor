-- Expandir tabela workflow_auto_triggers para suportar triggers recorrentes
ALTER TABLE public.workflow_auto_triggers 
ADD COLUMN next_execution_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN execution_count INTEGER DEFAULT 0,
ADD COLUMN max_executions INTEGER,
ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;

-- Criar índices para performance
CREATE INDEX idx_workflow_auto_triggers_next_execution 
ON public.workflow_auto_triggers (next_execution_at) 
WHERE is_active = true AND next_execution_at IS NOT NULL;

CREATE INDEX idx_workflow_auto_triggers_active_recurring 
ON public.workflow_auto_triggers (trigger_type, is_active, next_execution_at) 
WHERE is_active = true;

-- Atualizar triggers existentes com próxima execução calculada
UPDATE public.workflow_auto_triggers 
SET next_execution_at = now() + INTERVAL '1 minute'
WHERE trigger_type IN ('recurring_interval', 'recurring_schedule', 'recurring_monthly') 
AND is_active = true 
AND next_execution_at IS NULL;