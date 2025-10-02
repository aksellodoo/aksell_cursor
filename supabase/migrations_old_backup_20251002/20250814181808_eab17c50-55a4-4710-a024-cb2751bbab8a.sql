-- Adicionar campo device_fp_hash e criar índice único
ALTER TABLE public.trusted_devices 
ADD COLUMN IF NOT EXISTS device_fp_hash text;

-- Criar índice único para (user_id, device_fp_hash)
CREATE UNIQUE INDEX IF NOT EXISTS uq_trusted_devices_hash 
ON public.trusted_devices (user_id, device_fp_hash);

-- Adicionar campo label opcional
ALTER TABLE public.trusted_devices 
ADD COLUMN IF NOT EXISTS label text,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Criar função para limpeza de dispositivos expirados
CREATE OR REPLACE FUNCTION public.cleanup_expired_trusted_devices_enhanced()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  deleted_count integer;
BEGIN
  -- Marcar dispositivos expirados como inativos e depois deletar
  DELETE FROM trusted_devices 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log da limpeza
  INSERT INTO field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
  VALUES (
    gen_random_uuid(),
    'cleanup_expired_trusted_devices_enhanced',
    deleted_count::text,
    'automatic_cleanup',
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
    'system'
  );
  
  RETURN deleted_count;
END;
$function$;