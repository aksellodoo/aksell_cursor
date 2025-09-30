
-- 1) Remover a CHECK antiga (se existir)
ALTER TABLE public.workflows
DROP CONSTRAINT IF EXISTS workflows_trigger_type_check;

-- 2) Criar uma CHECK abrangente para os tipos de trigger usados no app
ALTER TABLE public.workflows
ADD CONSTRAINT workflows_trigger_type_check
CHECK (
  trigger_type IN (
    -- Tipos manuais/legados (compatibilidade)
    'manual', 'automatic', 'scheduled',
    -- Tipos usados no Builder
    'status_change',
    'date_time',
    'recurring_interval',
    'recurring_schedule',
    'recurring_monthly',
    'user_inactivity',
    'system_event',
    'protheus_record_change',
    -- Tipos suportados pelo motor de triggers automáticos
    'record_created',
    'task_completed',
    'deadline_missed',
    'department_inactive',
    'no_response',
    'field_change',
    'tasks_accumulation'
  )
);
