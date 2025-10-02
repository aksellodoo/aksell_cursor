-- Corrigir/criar as RPC functions para trusted devices
CREATE OR REPLACE FUNCTION public.check_device_trust_anonymous(device_fingerprint_param text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  device_count integer;
  device_record record;
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
  SELECT COUNT(*), 
         id, user_id, device_name, expires_at, last_used_at
  INTO device_count, device_record
  FROM public.trusted_devices 
  WHERE device_fingerprint = device_fingerprint_param 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
  GROUP BY id, user_id, device_name, expires_at, last_used_at
  LIMIT 1;

  -- Return result
  IF device_count > 0 THEN
    -- Update last used if found
    UPDATE public.trusted_devices 
    SET last_used_at = now()
    WHERE device_fingerprint = device_fingerprint_param 
      AND is_active = true;
      
    RETURN json_build_object(
      'success', true,
      'trusted', true,
      'device_id', device_record.id,
      'user_id', device_record.user_id,
      'device_name', device_record.device_name,
      'expires_at', device_record.expires_at,
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

-- Criar function para gerar device fingerprint
CREATE OR REPLACE FUNCTION public.generate_device_fingerprint(user_agent text, screen_resolution text, timezone text, language text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fingerprint_data text;
  fingerprint_hash text;
BEGIN
  -- Combine all data into a single string
  fingerprint_data := COALESCE(user_agent, '') || '|' || 
                     COALESCE(screen_resolution, '') || '|' || 
                     COALESCE(timezone, '') || '|' || 
                     COALESCE(language, '');
  
  -- Generate SHA-256 hash
  SELECT encode(digest(fingerprint_data, 'sha256'), 'hex') INTO fingerprint_hash;
  
  RETURN fingerprint_hash;
END;
$$;