-- Corrigir search_path nas funções criadas para resolver warnings de segurança
DROP FUNCTION IF EXISTS public.generate_device_fingerprint(text, text, text, text);
DROP FUNCTION IF EXISTS public.is_device_trusted(text);
DROP FUNCTION IF EXISTS public.cleanup_expired_trusted_devices();

CREATE OR REPLACE FUNCTION public.generate_device_fingerprint(
  user_agent_param text,
  screen_resolution text,
  timezone_param text,
  language_param text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  fingerprint_data text;
  device_hash text;
BEGIN
  -- Combinar dados do dispositivo em uma string
  fingerprint_data := user_agent_param || '|' || screen_resolution || '|' || timezone_param || '|' || language_param;
  
  -- Gerar hash SHA-256 usando sha256 ao invés de digest
  device_hash := encode(sha256(fingerprint_data::bytea), 'hex');
  
  RETURN device_hash;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_device_trusted(device_fingerprint_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  is_trusted boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.trusted_devices 
    WHERE device_fingerprint = device_fingerprint_param 
      AND user_id = auth.uid()
      AND is_active = true 
      AND expires_at > now()
  ) INTO is_trusted;
  
  RETURN is_trusted;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_trusted_devices()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Desativar dispositivos expirados
  UPDATE public.trusted_devices 
  SET is_active = false 
  WHERE expires_at < now() 
    AND is_active = true;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log da limpeza
  PERFORM public.log_security_event(
    'trusted_devices_cleanup',
    jsonb_build_object('cleaned_count', deleted_count)
  );
  
  RETURN deleted_count;
END;
$$;