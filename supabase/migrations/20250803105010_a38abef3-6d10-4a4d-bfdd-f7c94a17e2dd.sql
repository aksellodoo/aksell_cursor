-- Corrigir problemas de segurança das funções
DROP FUNCTION IF EXISTS public.generate_telegram_setup_code();
DROP FUNCTION IF EXISTS public.cleanup_expired_telegram_codes();

-- Recriar função para gerar código de setup do Telegram com search_path correto
CREATE OR REPLACE FUNCTION public.generate_telegram_setup_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  code TEXT;
BEGIN
  -- Gerar código de 6 dígitos
  code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  RETURN code;
END;
$$;

-- Recriar função para limpar códigos expirados do Telegram com search_path correto
CREATE OR REPLACE FUNCTION public.cleanup_expired_telegram_codes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  UPDATE public.profiles 
  SET telegram_setup_code = NULL,
      telegram_setup_code_expires_at = NULL
  WHERE telegram_setup_code_expires_at < NOW();
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RETURN cleaned_count;
END;
$$;