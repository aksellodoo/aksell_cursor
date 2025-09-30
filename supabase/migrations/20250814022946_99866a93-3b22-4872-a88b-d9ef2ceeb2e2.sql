-- Criar função para gerar hash do device fingerprint se não existir
CREATE OR REPLACE FUNCTION generate_device_fingerprint(
  user_agent_param text,
  screen_resolution text,
  timezone_param text,
  language_param text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  combined_string text;
  fingerprint_hash text;
BEGIN
  -- Combinar todas as características do dispositivo
  combined_string := user_agent_param || '|' || screen_resolution || '|' || timezone_param || '|' || language_param;
  
  -- Gerar hash SHA-256
  SELECT encode(digest(combined_string, 'sha256'), 'hex') INTO fingerprint_hash;
  
  RETURN fingerprint_hash;
END;
$$;

-- Criar função para verificar se dispositivo é confiável
CREATE OR REPLACE FUNCTION is_device_trusted(device_fingerprint_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_trusted boolean := false;
BEGIN
  -- Verificar se existe dispositivo ativo e não expirado para o usuário atual
  SELECT EXISTS (
    SELECT 1 
    FROM trusted_devices 
    WHERE user_id = auth.uid()
      AND device_fingerprint = device_fingerprint_param
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO is_trusted;
  
  -- Atualizar last_used_at se dispositivo for confiável
  IF is_trusted THEN
    UPDATE trusted_devices 
    SET last_used_at = now()
    WHERE user_id = auth.uid()
      AND device_fingerprint = device_fingerprint_param
      AND is_active = true;
  END IF;
  
  RETURN is_trusted;
END;
$$;

-- Criar função para limpeza de dispositivos expirados
CREATE OR REPLACE FUNCTION cleanup_expired_trusted_devices()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Marcar dispositivos expirados como inativos
  UPDATE trusted_devices 
  SET is_active = false
  WHERE is_active = true 
    AND expires_at IS NOT NULL 
    AND expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log da limpeza
  INSERT INTO field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
  VALUES (
    gen_random_uuid(),
    'cleanup_expired_trusted_devices',
    deleted_count::text,
    'automatic_cleanup',
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
    'system'
  );
  
  RETURN deleted_count;
END;
$$;