-- Fix is_device_trusted function to accept user_id parameter instead of using auth.uid()
CREATE OR REPLACE FUNCTION public.is_device_trusted(user_id_param uuid, device_fingerprint_param text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  is_trusted boolean := false;
BEGIN
  -- Verificar se existe dispositivo ativo e não expirado para o usuário especificado
  SELECT EXISTS (
    SELECT 1 
    FROM trusted_devices 
    WHERE user_id = user_id_param
      AND device_fingerprint = device_fingerprint_param
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO is_trusted;
  
  -- Atualizar last_used_at se dispositivo for confiável
  IF is_trusted THEN
    UPDATE trusted_devices 
    SET last_used_at = now()
    WHERE user_id = user_id_param
      AND device_fingerprint = device_fingerprint_param
      AND is_active = true;
  END IF;
  
  RETURN is_trusted;
END;
$function$