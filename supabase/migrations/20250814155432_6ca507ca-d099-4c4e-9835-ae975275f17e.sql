-- Corrigir RPC function com sintaxe correta para PostgreSQL
CREATE OR REPLACE FUNCTION public.check_device_trust_anonymous(device_fingerprint_param text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  device_exists boolean := false;
  device_id uuid;
  device_user_id uuid;
  device_name text;
  device_expires_at timestamp with time zone;
BEGIN
  -- Log the function call
  INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
  VALUES (
    gen_random_uuid(),
    'check_device_trust_anonymous_call',
    device_fingerprint_param,
    'function_called',
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
    'trusted_device_debug'
  );

  -- Check if device exists and is active
  SELECT 
    id, user_id, device_name, expires_at
  INTO 
    device_id, device_user_id, device_name, device_expires_at
  FROM public.trusted_devices 
  WHERE device_fingerprint = device_fingerprint_param 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;

  -- Check if we found a device
  device_exists := (device_id IS NOT NULL);

  -- Return result
  IF device_exists THEN
    -- Update last used if found
    UPDATE public.trusted_devices 
    SET last_used_at = now()
    WHERE device_fingerprint = device_fingerprint_param 
      AND is_active = true;
      
    RETURN json_build_object(
      'success', true,
      'trusted', true,
      'device_id', device_id,
      'user_id', device_user_id,
      'device_name', device_name,
      'expires_at', device_expires_at,
      'message', 'Device is trusted'
    );
  ELSE
    RETURN json_build_object(
      'success', true,
      'trusted', false,
      'message', 'Device not found or expired'
    );
  END IF;

EXCEPTION WHEN others THEN
  -- Log error
  INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
  VALUES (
    gen_random_uuid(),
    'check_device_trust_anonymous_error',
    SQLERRM,
    SQLSTATE,
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
    'trusted_device_error'
  );
    
  RETURN json_build_object(
    'success', false,
    'trusted', false,
    'error', SQLERRM,
    'message', 'Error checking device trust'
  );
END;
$$;