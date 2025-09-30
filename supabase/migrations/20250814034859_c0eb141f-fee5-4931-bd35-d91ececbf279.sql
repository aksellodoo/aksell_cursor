-- Criar função para verificação anônima de dispositivos confiáveis
CREATE OR REPLACE FUNCTION public.check_device_trust_anonymous(
  device_fingerprint_param text,
  client_ip_param text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  trusted_count INTEGER;
BEGIN
  -- Validar parâmetros
  IF device_fingerprint_param IS NULL OR length(device_fingerprint_param) < 10 THEN
    RETURN false;
  END IF;
  
  -- Contar dispositivos confiáveis ativos com o fingerprint fornecido
  SELECT COUNT(*) INTO trusted_count
  FROM public.trusted_devices
  WHERE device_fingerprint = device_fingerprint_param
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());
  
  -- Log da verificação (opcional, para auditoria)
  INSERT INTO public.field_audit_log (
    record_id,
    field_name,
    old_value,
    new_value,
    changed_by,
    record_type
  )
  VALUES (
    gen_random_uuid(),
    'anonymous_device_check',
    device_fingerprint_param,
    trusted_count::text,
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
    'security_audit'
  );
  
  RETURN trusted_count > 0;
END;
$$;