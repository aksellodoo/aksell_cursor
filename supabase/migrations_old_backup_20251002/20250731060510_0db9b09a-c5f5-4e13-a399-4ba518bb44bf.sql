-- Corrigir problemas de segurança detectados

-- 1. Corrigir search_path das funções
CREATE OR REPLACE FUNCTION public.generate_form_publication_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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

CREATE OR REPLACE FUNCTION public.hash_form_token(token_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  token_hash TEXT;
BEGIN
  -- Criar hash SHA-256 do token
  SELECT encode(digest(token_text, 'sha256'), 'hex') INTO token_hash;
  RETURN token_hash;
END;
$function$;

CREATE OR REPLACE FUNCTION public.resolve_form_token(token_text TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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
  WHERE token_hash = public.hash_form_token(token_text)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_access_count IS NULL OR access_count < max_access_count);
  
  -- Se encontrou o token, incrementar contador de acesso
  IF form_id_result IS NOT NULL THEN
    UPDATE public.form_publication_tokens
    SET access_count = access_count + 1
    WHERE token_hash = public.hash_form_token(token_text);
  END IF;
  
  RETURN form_id_result;
END;
$function$;