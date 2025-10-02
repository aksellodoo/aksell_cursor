-- Corrigir função RPC para usar parâmetro compatível com a tabela trusted_devices
DROP FUNCTION IF EXISTS public.check_device_trust_anonymous(text);

-- Recriar função com parâmetro correto que corresponde à coluna da tabela
CREATE OR REPLACE FUNCTION public.check_device_trust_anonymous(device_fingerprint_param text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  is_trusted boolean := false;
BEGIN
  -- Verificar se existe dispositivo confiável ativo com este fingerprint
  -- Usando a coluna correta 'device_fingerprint' (não 'fingerprint_hash')
  SELECT EXISTS (
    SELECT 1 FROM trusted_devices 
    WHERE device_fingerprint = device_fingerprint_param
      AND is_active = true 
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO is_trusted;
  
  RETURN is_trusted;
END;
$$;