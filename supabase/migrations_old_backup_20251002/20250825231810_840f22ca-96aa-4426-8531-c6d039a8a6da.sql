-- Criar tabela de rascunhos de tarefas
CREATE TABLE IF NOT EXISTS public.task_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  origin TEXT NOT NULL CHECK (origin IN ('fixed', 'template')),
  fixed_type fixed_task_type NULL,
  template_id UUID NULL REFERENCES public.task_templates(id) ON DELETE SET NULL,
  form_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'submitted', 'discarded')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.task_drafts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para rascunhos
CREATE POLICY "Users can read own drafts" ON public.task_drafts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own drafts" ON public.task_drafts  
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own drafts" ON public.task_drafts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tabela de uploads dos rascunhos
CREATE TABLE IF NOT EXISTS public.task_draft_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID NOT NULL REFERENCES public.task_drafts(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS para uploads
ALTER TABLE public.task_draft_uploads ENABLE ROW LEVEL SECURITY;

-- Política RLS para uploads (baseada no dono do draft)
CREATE POLICY "Users can manage uploads for own drafts" ON public.task_draft_uploads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.task_drafts d 
      WHERE d.id = draft_id AND d.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.task_drafts d 
      WHERE d.id = draft_id AND d.user_id = auth.uid()
    )
  );

-- Adicionar colunas virtuais para o índice único funcionar corretamente
ALTER TABLE public.task_drafts 
ADD COLUMN IF NOT EXISTS fixed_type_key TEXT GENERATED ALWAYS AS (COALESCE(fixed_type::text, '-')) STORED,
ADD COLUMN IF NOT EXISTS template_id_key TEXT GENERATED ALWAYS AS (COALESCE(template_id::text, '-')) STORED;

-- Índice único para garantir 1 rascunho aberto por chave
CREATE UNIQUE INDEX IF NOT EXISTS uq_task_drafts_open_key
ON public.task_drafts (user_id, origin, fixed_type_key, template_id_key)
WHERE status = 'open';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_task_drafts_user_status ON public.task_drafts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_task_drafts_updated_at ON public.task_drafts(updated_at DESC);

-- FK resiliente para template_id em tasks
ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_template_id_fkey;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_template_id_fkey
  FOREIGN KEY (template_id) REFERENCES public.task_templates(id) ON DELETE SET NULL;

-- Índice para buscar tarefas por form_id no payload usando expressão JSON segura
CREATE INDEX IF NOT EXISTS idx_tasks_form_id
ON public.tasks USING GIN ((payload->'form_id'));

-- Trigger para updated_at nos rascunhos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_task_drafts_updated_at') THEN
    CREATE TRIGGER trg_task_drafts_updated_at 
      BEFORE UPDATE ON public.task_drafts
      FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
  END IF;
END $$;

-- Função para limpeza de rascunhos antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_task_drafts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  UPDATE public.task_drafts 
  SET status = 'discarded'
  WHERE status = 'open' 
    AND updated_at < now() - INTERVAL '30 days';
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RETURN cleaned_count;
END;
$$;