-- Função genérica para updated_at
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END$$;

-- Adicionar colunas se não existirem
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS template_id uuid;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS template_snapshot jsonb DEFAULT '{}'::jsonb;

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

-- Constraints CHECK para validação mínima (usando DO block para idempotência)
DO $$
BEGIN
  -- Constraint para form type ter form_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'chk_tasks_form_has_form_id' 
                 AND table_name = 'tasks') THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT chk_tasks_form_has_form_id
      CHECK (fixed_type <> 'form' OR (payload ? 'form_id'));
  END IF;

  -- Constraint para approval type
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'chk_tasks_approval_min' 
                 AND table_name = 'tasks') THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT chk_tasks_approval_min
      CHECK (fixed_type <> 'approval'
             OR ((payload ? 'approvers') AND jsonb_typeof(payload->'approvers')='array'
                 AND jsonb_array_length(payload->'approvers')>0
                 AND (payload->>'approval_mode') IN ('single','any','all')));
  END IF;

  -- Constraint para signature type
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'chk_tasks_signature_min' 
                 AND table_name = 'tasks') THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT chk_tasks_signature_min
      CHECK (fixed_type <> 'signature'
             OR ((payload ? 'signers') AND jsonb_typeof(payload->'signers')='array'
                 AND jsonb_array_length(payload->'signers')>0 AND (payload ? 'document_id')));
  END IF;

  -- Constraint para email type
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'chk_tasks_email_min' 
                 AND table_name = 'tasks') THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT chk_tasks_email_min
      CHECK (fixed_type <> 'email'
             OR ((payload ? 'to') AND jsonb_typeof(payload->'to')='array'
                 AND jsonb_array_length(payload->'to')>0 AND (payload ? 'subject')));
  END IF;

  -- Constraint para meeting type
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'chk_tasks_meeting_times' 
                 AND table_name = 'tasks') THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT chk_tasks_meeting_times
      CHECK (fixed_type <> 'meeting'
             OR ((payload ? 'start') AND (payload ? 'end')
                 AND (payload->>'start')::timestamptz < (payload->>'end')::timestamptz));
  END IF;

  -- Constraint para workflow type
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'chk_tasks_workflow_id' 
                 AND table_name = 'tasks') THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT chk_tasks_workflow_id
      CHECK (fixed_type <> 'workflow' OR (payload ? 'workflow_id'));
  END IF;
END$$;

-- FK do template (resiliente)
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