-- Criar tabela para tokens de publicação de formulários
CREATE TABLE public.form_publication_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  token_type TEXT NOT NULL DEFAULT 'publication',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  access_count INTEGER DEFAULT 0,
  max_access_count INTEGER DEFAULT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Criar índices para melhor performance
CREATE INDEX idx_form_publication_tokens_form_id ON public.form_publication_tokens(form_id);
CREATE INDEX idx_form_publication_tokens_token_hash ON public.form_publication_tokens(token_hash);
CREATE INDEX idx_form_publication_tokens_active ON public.form_publication_tokens(is_active) WHERE is_active = true;

-- Habilitar RLS
ALTER TABLE public.form_publication_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view tokens for their forms" 
ON public.form_publication_tokens 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.forms 
    WHERE forms.id = form_publication_tokens.form_id 
    AND forms.created_by = auth.uid()
  )
);

CREATE POLICY "Users can create tokens for their forms" 
ON public.form_publication_tokens 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM public.forms 
    WHERE forms.id = form_publication_tokens.form_id 
    AND forms.created_by = auth.uid()
  )
);

CREATE POLICY "Users can update tokens for their forms" 
ON public.form_publication_tokens 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.forms 
    WHERE forms.id = form_publication_tokens.form_id 
    AND forms.created_by = auth.uid()
  )
);

CREATE POLICY "System can access tokens for validation" 
ON public.form_publication_tokens 
FOR SELECT 
USING (true);

-- Função para gerar token seguro de publicação
CREATE OR REPLACE FUNCTION public.generate_form_publication_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  token TEXT;
BEGIN
  -- Gerar token aleatório de 32 bytes (256 bits) em base64url
  token := encode(gen_random_bytes(32), 'base64');
  
  -- Limpar caracteres que podem causar problemas em URLs
  token := replace(token, '+', '-');
  token := replace(token, '/', '_');
  token := replace(token, '=', '');
  
  RETURN token;
END;
$function$;

-- Função para criar hash do token
CREATE OR REPLACE FUNCTION public.hash_form_token(token_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  token_hash TEXT;
BEGIN
  -- Criar hash SHA-256 do token
  SELECT encode(digest(token_text, 'sha256'), 'hex') INTO token_hash;
  RETURN token_hash;
END;
$function$;

-- Função para resolver token e obter form_id
CREATE OR REPLACE FUNCTION public.resolve_form_token(token_text TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  token_hash TEXT;
  form_id_result UUID;
BEGIN
  -- Criar hash do token
  token_hash := public.hash_form_token(token_text);
  
  -- Buscar token válido e ativo
  SELECT form_id INTO form_id_result
  FROM public.form_publication_tokens
  WHERE token_hash = hash_form_token(token_text)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_access_count IS NULL OR access_count < max_access_count);
  
  -- Se encontrou o token, incrementar contador de acesso
  IF form_id_result IS NOT NULL THEN
    UPDATE public.form_publication_tokens
    SET access_count = access_count + 1
    WHERE token_hash = hash_form_token(token_text);
  END IF;
  
  RETURN form_id_result;
END;
$function$;