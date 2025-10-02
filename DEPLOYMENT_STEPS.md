# Deployment Steps - Sistema de Notificação Multi-canal

Este documento contém os passos necessários para completar o deployment da Fase 1 do Sistema de Notificação Multi-canal.

## ✅ Já Concluído

- ✅ Implementação de todos os componentes React
- ✅ Criação das migrations SQL
- ✅ Criação da edge function
- ✅ Commit e push para GitHub

## 🔧 Passos Restantes

### 1. Executar Migrations SQL no Supabase

Acesse o [Supabase Dashboard](https://supabase.com/dashboard) e execute as migrations manualmente:

#### Migration 1: Form External Contacts
```sql
-- Arquivo: supabase/migrations/20251002230000_add_form_external_contacts.sql

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
```

#### Migration 2: Form Invitations
```sql
-- Arquivo: supabase/migrations/20251003000000_create_form_invitations.sql

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
```

**Como executar:**
1. Acesse o Supabase Dashboard
2. Vá em "SQL Editor"
3. Crie uma nova query
4. Cole e execute a Migration 1
5. Crie outra nova query
6. Cole e execute a Migration 2
7. Verifique se as tabelas foram criadas corretamente em "Database" > "Tables"

### 2. Configurar Resend API Secret

Certifique-se de que o secret `RESEND_API_KEY` está configurado no Supabase:

1. Acesse Supabase Dashboard > Settings > Edge Functions
2. Adicione o secret: `RESEND_API_KEY` = `[sua chave da Resend API]`

### 3. Deploy da Edge Function

A edge function precisa ser deployada manualmente. Existem duas opções:

#### Opção A: Via Supabase Dashboard (Recomendado)

1. Acesse Supabase Dashboard > Edge Functions
2. Clique em "New Function"
3. Nome: `send-form-invitation`
4. Cole o conteúdo do arquivo `supabase/functions/send-form-invitation/index.ts`
5. Deploy

#### Opção B: Via Supabase CLI (se instalado localmente)

```bash
# Instalar Supabase CLI (macOS com Homebrew)
brew install supabase/tap/supabase

# Login no Supabase
supabase login

# Link ao projeto
supabase link --project-ref [seu-project-ref]

# Deploy da função
supabase functions deploy send-form-invitation
```

### 4. Testar o Fluxo Completo

Após executar os passos acima, teste o fluxo:

1. **Criar formulário:**
   - Acesse a aplicação
   - Crie um novo formulário
   - Configure o status como "Publicado Externo" ou "Publicado Misto"

2. **Selecionar contatos:**
   - Na aba "Destinatários", adicione contatos externos
   - Certifique-se de que os contatos têm email cadastrado
   - Salve o formulário

3. **Configurar canais:**
   - O modal "Seletor de Canais de Entrega" deve aparecer
   - Selecione os canais disponíveis (email deve estar marcado)
   - Clique em "Enviar Convites"

4. **Verificar envio:**
   - Aguarde o progresso completar
   - Verifique se apareceu a mensagem de sucesso
   - Confira o email na caixa de entrada do contato

5. **Preencher formulário:**
   - Abra o link recebido no email
   - Preencha o formulário
   - Submeta a resposta

6. **Verificar resposta:**
   - Verifique se a resposta aparece no dashboard
   - Confirme que o status do convite foi atualizado para "respondido"

## 📋 Checklist de Deployment

- [ ] Migration 1 executada com sucesso
- [ ] Migration 2 executada com sucesso
- [ ] Tabelas criadas no banco: `form_external_contacts`, `form_external_invitations`
- [ ] RLS policies criadas corretamente
- [ ] Secret `RESEND_API_KEY` configurado
- [ ] Edge function `send-form-invitation` deployada
- [ ] Teste de criação de formulário externo
- [ ] Teste de seleção de contatos
- [ ] Teste de envio de convites
- [ ] Teste de recebimento de email
- [ ] Teste de preenchimento via link público
- [ ] Teste de submissão de resposta
- [ ] Verificação de tracking de status

## 🔍 Troubleshooting

### Email não está sendo enviado
- Verifique se o secret `RESEND_API_KEY` está configurado
- Verifique os logs da edge function no Supabase Dashboard
- Confirme que o domínio `aksell.com.br` está verificado na Resend

### Token inválido ou expirado
- Verifique se a migration 2 foi executada corretamente
- Confirme que a política de acesso público está ativa
- Verifique se o token está sendo gerado corretamente (UUID v4)

### Formulário não carrega na página pública
- Verifique se a rota `/formulario/publico/:token` está configurada
- Confirme que o componente `FormPublicFill` está sendo importado
- Verifique os logs do console do navegador

### Resposta não está sendo registrada
- Verifique se a tabela `form_responses` existe
- Confirme que as RLS policies permitem inserção pública
- Verifique se o `response_id` está sendo atualizado corretamente
