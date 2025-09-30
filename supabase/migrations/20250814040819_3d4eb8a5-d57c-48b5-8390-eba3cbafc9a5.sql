-- Corrigir função RPC que estava causando erro de transação
CREATE OR REPLACE FUNCTION public.check_device_trust_anonymous(device_fingerprint_hash text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  is_trusted boolean := false;
BEGIN
  -- Verificar se existe dispositivo confiável ativo com este fingerprint
  SELECT EXISTS (
    SELECT 1 FROM trusted_devices 
    WHERE fingerprint_hash = device_fingerprint_hash
      AND is_active = true 
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO is_trusted;
  
  -- REMOVIDO: audit log para evitar erro de transação em função read-only
  -- Função deve ser purely read-only para funcionar corretamente
  
  RETURN is_trusted;
END;
$$;