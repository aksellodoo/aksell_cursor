-- Criar tabela para relacionamento entre formulários e contatos externos
CREATE TABLE IF NOT EXISTS public.form_external_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(form_id, contact_id)
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_form_external_contacts_form_id ON public.form_external_contacts(form_id);
CREATE INDEX IF NOT EXISTS idx_form_external_contacts_contact_id ON public.form_external_contacts(contact_id);

-- Habilitar RLS
ALTER TABLE public.form_external_contacts ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver relacionamentos de formulários que criaram
CREATE POLICY "Usuários podem ver relacionamentos de seus formulários"
  ON public.form_external_contacts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE forms.id = form_external_contacts.form_id
      AND forms.created_by = auth.uid()
    )
  );

-- Política: Usuários podem criar relacionamentos em formulários que criaram
CREATE POLICY "Usuários podem criar relacionamentos em seus formulários"
  ON public.form_external_contacts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE forms.id = form_external_contacts.form_id
      AND forms.created_by = auth.uid()
    )
  );

-- Política: Usuários podem deletar relacionamentos de formulários que criaram
CREATE POLICY "Usuários podem deletar relacionamentos de seus formulários"
  ON public.form_external_contacts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE forms.id = form_external_contacts.form_id
      AND forms.created_by = auth.uid()
    )
  );

-- Comentários para documentação
COMMENT ON TABLE public.form_external_contacts IS 'Relacionamento entre formulários e contatos da base de Gestão de Contatos para destinatários externos';
COMMENT ON COLUMN public.form_external_contacts.form_id IS 'ID do formulário';
COMMENT ON COLUMN public.form_external_contacts.contact_id IS 'ID do contato da tabela contacts';
COMMENT ON COLUMN public.form_external_contacts.created_by IS 'Usuário que criou o relacionamento';
