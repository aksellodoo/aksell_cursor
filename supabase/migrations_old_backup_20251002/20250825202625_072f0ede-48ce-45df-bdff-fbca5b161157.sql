-- Função genérica para updated_at
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END$$;

-- Adicionar colunas updated_at se não existirem
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Adicionar template_snapshot para auditoria
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS template_snapshot jsonb DEFAULT '{}'::jsonb;

-- Triggers para updated_at (idempotentes)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_task_templates_updated_at') THEN
    CREATE TRIGGER trg_task_templates_updated_at
    BEFORE UPDATE ON public.task_templates
    FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_tasks_updated_at') THEN
    CREATE TRIGGER trg_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
  END IF;
END$$;

-- Índice funcional para form_id no payload
CREATE INDEX IF NOT EXISTS idx_tasks_form_id ON public.tasks ((payload->>'form_id'));

-- Constraints CHECK para validação mínima
ALTER TABLE public.tasks
  ADD CONSTRAINT IF NOT EXISTS chk_tasks_form_has_form_id
  CHECK (fixed_type <> 'form' OR (payload ? 'form_id'));

ALTER TABLE public.tasks
  ADD CONSTRAINT IF NOT EXISTS chk_tasks_approval_min
  CHECK (fixed_type <> 'approval'
         OR ((payload ? 'approvers') AND jsonb_typeof(payload->'approvers')='array'
             AND jsonb_array_length(payload->'approvers')>0
             AND (payload->>'approval_mode') IN ('single','any','all')));

ALTER TABLE public.tasks
  ADD CONSTRAINT IF NOT EXISTS chk_tasks_signature_min
  CHECK (fixed_type <> 'signature'
         OR ((payload ? 'signers') AND jsonb_typeof(payload->'signers')='array'
             AND jsonb_array_length(payload->'signers')>0 AND (payload ? 'document_id')));

ALTER TABLE public.tasks
  ADD CONSTRAINT IF NOT EXISTS chk_tasks_email_min
  CHECK (fixed_type <> 'email'
         OR ((payload ? 'to') AND jsonb_typeof(payload->'to')='array'
             AND jsonb_array_length(payload->'to')>0 AND (payload ? 'subject')));

ALTER TABLE public.tasks
  ADD CONSTRAINT IF NOT EXISTS chk_tasks_meeting_times
  CHECK (fixed_type <> 'meeting'
         OR ((payload ? 'start') AND (payload ? 'end')
             AND (payload->>'start')::timestamptz < (payload->>'end')::timestamptz));

ALTER TABLE public.tasks
  ADD CONSTRAINT IF NOT EXISTS chk_tasks_workflow_id
  CHECK (fixed_type <> 'workflow' OR (payload ? 'workflow_id'));

-- Ajustar FK do template para ser mais resiliente
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
             WHERE constraint_name='tasks_template_id_fkey') THEN
    ALTER TABLE public.tasks DROP CONSTRAINT tasks_template_id_fkey;
  END IF;
END$$;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_template_id_fkey
  FOREIGN KEY (template_id) REFERENCES public.task_templates(id) ON DELETE SET NULL;