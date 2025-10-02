-- Adicionar colunas de publicação na tabela forms
ALTER TABLE public.forms 
ADD COLUMN publication_status text NOT NULL DEFAULT 'draft',
ADD COLUMN publication_settings jsonb DEFAULT '{}',
ADD COLUMN allows_anonymous_responses boolean DEFAULT false,
ADD COLUMN version_number integer DEFAULT 1,
ADD COLUMN parent_form_id uuid REFERENCES public.forms(id),
ADD COLUMN is_published boolean DEFAULT false,
ADD COLUMN published_at timestamp with time zone,
ADD COLUMN internal_recipients jsonb DEFAULT '[]',
ADD COLUMN has_responses boolean DEFAULT false;

-- Criar tabela para destinatários externos
CREATE TABLE public.form_external_recipients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  password_hash text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_access timestamp with time zone,
  access_count integer DEFAULT 0
);

-- Criar tabela para versões de formulários
CREATE TABLE public.form_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  title text NOT NULL,
  description text,
  fields_definition jsonb NOT NULL DEFAULT '[]',
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  is_current boolean DEFAULT false,
  response_count integer DEFAULT 0
);

-- Criar tabela para sessões de acesso externo
CREATE TABLE public.form_external_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id uuid NOT NULL REFERENCES public.form_external_recipients(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE public.form_external_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_external_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies para form_external_recipients
CREATE POLICY "Form creators can manage external recipients"
ON public.form_external_recipients
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.forms 
  WHERE forms.id = form_external_recipients.form_id 
  AND forms.created_by = auth.uid()
));

-- RLS Policies para form_versions
CREATE POLICY "Users can view form versions with access"
ON public.form_versions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.forms 
  WHERE forms.id = form_versions.form_id 
  AND can_access_form(forms.confidentiality_level, forms.allowed_users, forms.allowed_departments, forms.allowed_roles, auth.uid())
));

CREATE POLICY "Form creators can manage versions"
ON public.form_versions
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.forms 
  WHERE forms.id = form_versions.form_id 
  AND forms.created_by = auth.uid()
));

-- RLS Policies para form_external_sessions
CREATE POLICY "System can manage external sessions"
ON public.form_external_sessions
FOR ALL
USING (true);

-- Função para criar versão automaticamente
CREATE OR REPLACE FUNCTION public.create_form_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o formulário já tem respostas e está sendo alterado, criar nova versão
  IF OLD.has_responses = true AND (
    OLD.title IS DISTINCT FROM NEW.title OR
    OLD.description IS DISTINCT FROM NEW.description OR
    OLD.fields_definition IS DISTINCT FROM NEW.fields_definition OR
    OLD.settings IS DISTINCT FROM NEW.settings
  ) THEN
    -- Criar versão da versão anterior
    INSERT INTO public.form_versions (
      form_id, version_number, title, description, fields_definition, 
      settings, created_by, is_current, response_count
    ) VALUES (
      OLD.id, OLD.version_number, OLD.title, OLD.description, 
      OLD.fields_definition, OLD.settings, OLD.created_by, false,
      (SELECT COUNT(*) FROM public.form_responses WHERE form_id = OLD.id)
    );
    
    -- Incrementar versão do formulário atual
    NEW.version_number = OLD.version_number + 1;
    NEW.has_responses = false;
    NEW.is_published = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para versionamento automático
CREATE TRIGGER form_versioning_trigger
  BEFORE UPDATE ON public.forms
  FOR EACH ROW
  EXECUTE FUNCTION public.create_form_version();

-- Função para gerar hash de senha
CREATE OR REPLACE FUNCTION public.generate_password_hash(password text)
RETURNS text AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar senha
CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
RETURNS boolean AS $$
BEGIN
  RETURN hash = crypt(password, hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Índices para performance
CREATE INDEX idx_form_external_recipients_form_id ON public.form_external_recipients(form_id);
CREATE INDEX idx_form_external_recipients_email ON public.form_external_recipients(email);
CREATE INDEX idx_form_versions_form_id ON public.form_versions(form_id);
CREATE INDEX idx_form_versions_current ON public.form_versions(form_id, is_current);
CREATE INDEX idx_form_external_sessions_token ON public.form_external_sessions(session_token);
CREATE INDEX idx_form_external_sessions_recipient ON public.form_external_sessions(recipient_id);

-- Atualizar enum de status se necessário
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'form_publication_status') THEN
    CREATE TYPE form_publication_status AS ENUM ('draft', 'published_internal', 'published_external', 'published_mixed', 'unpublished');
  END IF;
END $$;