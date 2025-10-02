-- Fix is_device_trusted function to be read-only for query operations
-- Create a separate function for updating last_used_at
CREATE OR REPLACE FUNCTION public.is_device_trusted(user_id_param uuid, device_fingerprint_param text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
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
  
  RETURN is_trusted;
END;
$function$;

-- Create a separate function to update last_used_at
CREATE OR REPLACE FUNCTION public.update_device_last_used(user_id_param uuid, device_fingerprint_param text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Atualizar last_used_at se dispositivo for confiável
  UPDATE trusted_devices 
  SET last_used_at = now()
  WHERE user_id = user_id_param
    AND device_fingerprint = device_fingerprint_param
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());
  
  RETURN FOUND;
END;
$function$;