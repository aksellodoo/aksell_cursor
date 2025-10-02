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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_task_drafts_user_status ON public.task_drafts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_task_drafts_updated_at ON public.task_drafts(updated_at DESC);

-- FK resiliente para template_id em tasks
ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_template_id_fkey;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_template_id_fkey
  FOREIGN KEY (template_id) REFERENCES public.task_templates(id) ON DELETE SET NULL;

-- Índice para buscar tarefas por form_id no payload
CREATE INDEX IF NOT EXISTS idx_tasks_form_id
ON public.tasks ((payload->>'form_id'))
WHERE payload->>'form_id' IS NOT NULL;

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

-- Constraint única manual usando trigger para garantir um rascunho aberto por chave
CREATE OR REPLACE FUNCTION public.check_single_open_draft()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Só verifica se está inserindo/atualizando para status 'open'
  IF NEW.status = 'open' THEN
    -- Verifica se já existe outro rascunho aberto para a mesma chave
    IF EXISTS (
      SELECT 1 
      FROM public.task_drafts 
      WHERE user_id = NEW.user_id
        AND origin = NEW.origin
        AND status = 'open'
        AND (
          (NEW.origin = 'fixed' AND fixed_type = NEW.fixed_type) OR
          (NEW.origin = 'template' AND template_id = NEW.template_id)
        )
        AND id != NEW.id  -- Excluir o próprio registro em caso de UPDATE
    ) THEN
      RAISE EXCEPTION 'Já existe um rascunho aberto para esta combinação user/origin/type';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para validação de rascunho único
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_check_single_open_draft') THEN
    CREATE TRIGGER trg_check_single_open_draft
      BEFORE INSERT OR UPDATE ON public.task_drafts
      FOR EACH ROW EXECUTE FUNCTION public.check_single_open_draft();
  END IF;
END $$;