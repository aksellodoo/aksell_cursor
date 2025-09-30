-- Criar estruturas de recorrência de tarefas

-- 1) Enum para fixed_task_type (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fixed_task_type') THEN
    CREATE TYPE public.fixed_task_type AS ENUM ('simple', 'approval', 'form', 'checklist');
  END IF;
END$$;

-- 2) Série de recorrência (master)
CREATE TABLE IF NOT EXISTS public.task_series (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  fixed_type public.fixed_task_type not null,
  base_payload jsonb not null default '{}'::jsonb,
  base_template_id uuid null references public.task_templates(id) on delete set null,
  base_template_snapshot jsonb not null default '{}'::jsonb,
  timezone text not null default 'America/Sao_Paulo',
  dtstart timestamptz not null,                    -- âncora
  rrule text not null,                             -- RFC 5545 (ex.: FREQ=MONTHLY;BYDAY=FR;BYSETPOS=-1)
  exdates timestamptz[] default '{}',
  until_date timestamptz null,
  count_limit int null,
  -- geração controlada
  lookahead_count int not null default 1,          -- quantas próximas manter criadas
  catch_up_limit int not null default 1,           -- quantas perdidas gerar ao religar
  generation_mode text not null default 'on_schedule', -- 'on_schedule' | 'on_prev_complete'
  adjust_policy text not null default 'none',      -- 'none' | 'previous_business_day' | 'next_business_day'
  days_before_due int not null default 0,          -- se quiser criar X dias antes
  next_run_at timestamptz not null,                -- cursor para o job
  status text not null default 'active',           -- active | paused | ended
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3) RLS para task_series
ALTER TABLE public.task_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "series_owner" ON public.task_series
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- 4) Ligação nas tarefas
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS series_id uuid null references public.task_series(id) on delete set null,
  ADD COLUMN IF NOT EXISTS occurrence_no int null,            -- 1,2,3...
  ADD COLUMN IF NOT EXISTS occurrence_start timestamptz null,
  ADD COLUMN IF NOT EXISTS occurrence_end timestamptz null;

-- 5) Índices únicos e utilitários
CREATE UNIQUE INDEX IF NOT EXISTS uq_tasks_series_occurrence
  ON public.tasks (series_id, occurrence_no) WHERE series_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_task_series_next_run ON public.task_series(next_run_at);

-- 6) Trigger para updated_at
CREATE OR REPLACE FUNCTION update_task_series_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_series_updated_at
  BEFORE UPDATE ON public.task_series
  FOR EACH ROW
  EXECUTE FUNCTION update_task_series_updated_at();