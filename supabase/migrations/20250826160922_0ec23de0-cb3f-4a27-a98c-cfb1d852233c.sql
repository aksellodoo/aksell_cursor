
-- 1) Datas: adicionar colunas, índices e constraint (ordem entre as duas datas)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS expected_completion_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS deadline_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_expected_completion_at ON public.tasks(expected_completion_at);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline_at ON public.tasks(deadline_at);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_task_dates_order'
      AND conrelid = 'public.tasks'::regclass
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT chk_task_dates_order
      CHECK (
        deadline_at IS NULL OR expected_completion_at IS NULL OR expected_completion_at <= deadline_at
      );
  END IF;
END $$;

-- Backfill leve: popular expected_completion_at a partir de due_date quando nulo
UPDATE public.tasks
SET expected_completion_at = due_date
WHERE expected_completion_at IS NULL
  AND due_date IS NOT NULL;

-- 2) Prioridade: criar enum e migrar coluna existente de texto -> enum
DO $$ BEGIN
  CREATE TYPE public.task_priority AS ENUM ('P1','P2','P3','P4');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
DECLARE
  v_data_type text;
BEGIN
  SELECT data_type
    INTO v_data_type
  FROM information_schema.columns
  WHERE table_schema='public'
    AND table_name='tasks'
    AND column_name='priority';

  IF NOT FOUND THEN
    EXECUTE 'ALTER TABLE public.tasks ADD COLUMN priority public.task_priority NOT NULL DEFAULT ''P3''';
  ELSIF v_data_type <> 'USER-DEFINED' THEN
    -- Migrar valores de texto para enum (mapeando valores atuais)
    BEGIN
      EXECUTE '
        ALTER TABLE public.tasks
        ALTER COLUMN priority TYPE public.task_priority
        USING (
          CASE lower(priority)
            WHEN ''urgent'' THEN ''P1''::public.task_priority
            WHEN ''high''   THEN ''P2''::public.task_priority
            WHEN ''medium'' THEN ''P3''::public.task_priority
            WHEN ''low''    THEN ''P4''::public.task_priority
            WHEN ''p1'' THEN ''P1''::public.task_priority
            WHEN ''p2'' THEN ''P2''::public.task_priority
            WHEN ''p3'' THEN ''P3''::public.task_priority
            WHEN ''p4'' THEN ''P4''::public.task_priority
            ELSE ''P3''::public.task_priority
          END
        )';
      EXECUTE 'ALTER TABLE public.tasks ALTER COLUMN priority SET DEFAULT ''P3''';
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Nao foi possivel converter tasks.priority para enum automaticamente: %', SQLERRM;
    END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);

-- 3) Tags: garantir índice GIN (coluna já existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname='public'
      AND tablename='tasks'
      AND indexname='idx_tasks_tags_gin'
  ) THEN
    EXECUTE 'CREATE INDEX idx_tasks_tags_gin ON public.tasks USING gin (tags)';
  END IF;
END $$;

-- 4) Templates: defaults opcionais (offsets, prioridade e tags)
ALTER TABLE public.task_templates
  ADD COLUMN IF NOT EXISTS default_expected_offset_hours int,
  ADD COLUMN IF NOT EXISTS default_deadline_offset_hours int,
  ADD COLUMN IF NOT EXISTS default_priority public.task_priority,
  ADD COLUMN IF NOT EXISTS default_tags text[] NOT NULL DEFAULT '{}';
