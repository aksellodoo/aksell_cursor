
-- 1) Tabela de rascunhos de respostas
CREATE TABLE public.form_response_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  response_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  progress_percent numeric(5,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) RLS
ALTER TABLE public.form_response_drafts ENABLE ROW LEVEL SECURITY;

-- Índices e unicidade
CREATE INDEX idx_form_response_drafts_form_id ON public.form_response_drafts(form_id);
CREATE INDEX idx_form_response_drafts_user_id ON public.form_response_drafts(user_id);
CREATE UNIQUE INDEX ux_form_response_drafts_form_user ON public.form_response_drafts(form_id, user_id);

-- Trigger para updated_at
CREATE TRIGGER set_updated_at_before_update_form_response_drafts
BEFORE UPDATE ON public.form_response_drafts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Políticas:
-- Usuários podem gerenciar seus próprios rascunhos
CREATE POLICY "Users can manage their own drafts"
  ON public.form_response_drafts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Criadores do formulário podem visualizar rascunhos do seu formulário
CREATE POLICY "Form creators can view drafts for their forms"
  ON public.form_response_drafts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.forms f
      WHERE f.id = form_response_drafts.form_id
        AND f.created_by = auth.uid()
    )
  );
