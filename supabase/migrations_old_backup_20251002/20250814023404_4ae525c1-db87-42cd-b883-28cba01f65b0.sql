-- Habilitar extensão pgcrypto se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Recriar função com fallback para MD5 se digest não funcionar
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
  
  -- Tentar usar SHA-256 primeiro
  BEGIN
    SELECT encode(digest(combined_string, 'sha256'), 'hex') INTO fingerprint_hash;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback para MD5 se digest não funcionar
    fingerprint_hash := md5(combined_string);
  END;
  
  RETURN fingerprint_hash;
END;
$$;