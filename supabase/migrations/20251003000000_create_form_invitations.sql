-- Criar tabela para gerenciar convites e envios de formulários externos
CREATE TABLE IF NOT EXISTS public.form_external_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,

  -- Canais de comunicação selecionados
  send_via_email boolean NOT NULL DEFAULT false,
  send_via_whatsapp boolean NOT NULL DEFAULT false,
  send_via_telegram boolean NOT NULL DEFAULT false,

  -- Status e timestamps de envio por canal
  email_sent_at timestamp with time zone NULL,
  email_opened_at timestamp with time zone NULL,
  whatsapp_sent_at timestamp with time zone NULL,
  telegram_sent_at timestamp with time zone NULL,

  -- Token único para acesso ao formulário
  form_access_token text NOT NULL UNIQUE,

  -- Status de resposta
  responded_at timestamp with time zone NULL,
  response_id uuid NULL REFERENCES public.form_responses(id) ON DELETE SET NULL,

  -- Metadados
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  -- Garantir que cada contato só receba um convite por formulário
  UNIQUE(form_id, contact_id)
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_form_external_invitations_form_id
  ON public.form_external_invitations(form_id);

CREATE INDEX IF NOT EXISTS idx_form_external_invitations_contact_id
  ON public.form_external_invitations(contact_id);

CREATE INDEX IF NOT EXISTS idx_form_external_invitations_token
  ON public.form_external_invitations(form_access_token);

CREATE INDEX IF NOT EXISTS idx_form_external_invitations_response_id
  ON public.form_external_invitations(response_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_form_external_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_form_external_invitations_updated_at
  BEFORE UPDATE ON public.form_external_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_form_external_invitations_updated_at();

-- Habilitar RLS
ALTER TABLE public.form_external_invitations ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver convites de formulários que criaram
CREATE POLICY "Usuários podem ver convites de seus formulários"
  ON public.form_external_invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE forms.id = form_external_invitations.form_id
      AND forms.created_by = auth.uid()
    )
  );

-- Política: Usuários podem criar convites em formulários que criaram
CREATE POLICY "Usuários podem criar convites em seus formulários"
  ON public.form_external_invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE forms.id = form_external_invitations.form_id
      AND forms.created_by = auth.uid()
    )
  );

-- Política: Usuários podem atualizar convites de formulários que criaram
CREATE POLICY "Usuários podem atualizar convites de seus formulários"
  ON public.form_external_invitations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE forms.id = form_external_invitations.form_id
      AND forms.created_by = auth.uid()
    )
  );

-- Política: Usuários podem deletar convites de formulários que criaram
CREATE POLICY "Usuários podem deletar convites de seus formulários"
  ON public.form_external_invitations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE forms.id = form_external_invitations.form_id
      AND forms.created_by = auth.uid()
    )
  );

-- Política especial: Acesso público para validação de token (sem autenticação)
CREATE POLICY "Acesso público para validação de token"
  ON public.form_external_invitations
  FOR SELECT
  USING (true); -- Permite leitura sem autenticação para validar tokens

-- Comentários para documentação
COMMENT ON TABLE public.form_external_invitations IS
  'Gerencia convites enviados para contatos externos preencherem formulários, incluindo canais de comunicação e rastreamento de envios';

COMMENT ON COLUMN public.form_external_invitations.form_id IS
  'ID do formulário para o qual o convite foi enviado';

COMMENT ON COLUMN public.form_external_invitations.contact_id IS
  'ID do contato que recebeu o convite';

COMMENT ON COLUMN public.form_external_invitations.send_via_email IS
  'Indica se o convite deve/foi enviado por email';

COMMENT ON COLUMN public.form_external_invitations.send_via_whatsapp IS
  'Indica se o convite deve/foi enviado por WhatsApp';

COMMENT ON COLUMN public.form_external_invitations.send_via_telegram IS
  'Indica se o convite deve/foi enviado por Telegram';

COMMENT ON COLUMN public.form_external_invitations.form_access_token IS
  'Token único e seguro para acesso ao formulário sem autenticação';

COMMENT ON COLUMN public.form_external_invitations.responded_at IS
  'Timestamp de quando o formulário foi respondido';

COMMENT ON COLUMN public.form_external_invitations.response_id IS
  'Referência para a resposta submetida (form_responses)';
