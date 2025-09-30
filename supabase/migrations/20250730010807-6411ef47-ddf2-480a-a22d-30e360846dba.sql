-- Criar tabela para tokens de reset de senha
CREATE TABLE public.password_reset_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + '24:00:00'::interval),
  used_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NULL,
  reset_type TEXT NOT NULL DEFAULT 'user_request' -- 'user_request', 'admin_forced', 'new_user'
);

-- Enable RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Política para permitir que o sistema crie tokens
CREATE POLICY "System can create password reset tokens" 
ON public.password_reset_tokens 
FOR INSERT 
WITH CHECK (true);

-- Política para permitir que o sistema leia tokens (para validação)
CREATE POLICY "System can read password reset tokens" 
ON public.password_reset_tokens 
FOR SELECT 
USING (true);

-- Política para permitir que o sistema atualize tokens (marcar como usado)
CREATE POLICY "System can update password reset tokens" 
ON public.password_reset_tokens 
FOR UPDATE 
USING (true);

-- Função para limpar tokens expirados
CREATE OR REPLACE FUNCTION public.cleanup_expired_password_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Remover tokens expirados
  DELETE FROM public.password_reset_tokens 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Remover tokens usados há mais de 7 dias
  DELETE FROM public.password_reset_tokens 
  WHERE used_at IS NOT NULL 
    AND used_at < now() - INTERVAL '7 days';
  
  RETURN deleted_count;
END;
$$;

-- Função para gerar token de reset
CREATE OR REPLACE FUNCTION public.generate_password_reset_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  token TEXT;
BEGIN
  -- Gerar token aleatório de 64 caracteres
  token := encode(gen_random_bytes(48), 'base64url');
  
  RETURN token;
END;
$$;