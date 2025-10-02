-- Corrigir warning de segurança - definir search_path explícito
CREATE OR REPLACE FUNCTION public.cleanup_expired_password_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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

-- Corrigir search_path para função de gerar token
CREATE OR REPLACE FUNCTION public.generate_password_reset_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  token TEXT;
BEGIN
  -- Gerar token aleatório de 64 caracteres
  token := encode(gen_random_bytes(48), 'base64url');
  
  RETURN token;
END;
$$;