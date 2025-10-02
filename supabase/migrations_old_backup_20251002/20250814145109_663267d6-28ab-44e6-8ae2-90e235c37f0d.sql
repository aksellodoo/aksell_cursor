-- LIMPEZA AGRESSIVA: Remove TODAS as possíveis versões da função check_device_trust_anonymous
DROP FUNCTION IF EXISTS public.check_device_trust_anonymous;
DROP FUNCTION IF EXISTS public.check_device_trust_anonymous(text);
DROP FUNCTION IF EXISTS public.check_device_trust_anonymous(device_fingerprint_param text);
DROP FUNCTION IF EXISTS public.check_device_trust_anonymous(varchar);
DROP FUNCTION IF EXISTS public.check_device_trust_anonymous(character varying);

-- Criar função generate_device_fingerprint se não existir
CREATE OR REPLACE FUNCTION public.generate_device_fingerprint(
  user_agent_param text,
  screen_resolution text,
  timezone_param text,
  language_param text
)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  combined_string text;
  hash_result text;
BEGIN
  -- Combinar todos os parâmetros em uma string única
  combined_string := user_agent_param || '|' || screen_resolution || '|' || timezone_param || '|' || language_param;
  
  -- Criar hash SHA-256
  SELECT encode(digest(combined_string, 'sha256'), 'hex') INTO hash_result;
  
  RETURN hash_result;
END;
$function$;

-- Criar UMA ÚNICA versão limpa da função check_device_trust_anonymous
CREATE OR REPLACE FUNCTION public.check_device_trust_anonymous(device_fingerprint_param text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_trusted boolean := false;
BEGIN
  -- Log para debug
  RAISE LOG 'check_device_trust_anonymous called with fingerprint: %', LEFT(device_fingerprint_param, 10);
  
  -- Verificar se existe dispositivo confiável
  SELECT EXISTS (
    SELECT 1 FROM trusted_devices 
    WHERE device_fingerprint = device_fingerprint_param
      AND is_active = true 
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO is_trusted;
  
  RAISE LOG 'Device trust check result: %', is_trusted;
  
  RETURN is_trusted;
END;
$function$;