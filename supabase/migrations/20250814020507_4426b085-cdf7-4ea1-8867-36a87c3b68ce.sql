-- Criar função para gerar fingerprint do dispositivo
CREATE OR REPLACE FUNCTION public.generate_device_fingerprint(
  user_agent_param text,
  screen_resolution text,
  timezone_param text,
  language_param text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  fingerprint_data text;
  device_hash text;
BEGIN
  -- Combinar dados do dispositivo em uma string
  fingerprint_data := user_agent_param || '|' || screen_resolution || '|' || timezone_param || '|' || language_param;
  
  -- Gerar hash SHA-256
  SELECT encode(digest(fingerprint_data, 'sha256'), 'hex') INTO device_hash;
  
  RETURN device_hash;
END;
$$;

-- Verificar se a função is_device_trusted existe, se não, criar
CREATE OR REPLACE FUNCTION public.is_device_trusted(device_fingerprint_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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