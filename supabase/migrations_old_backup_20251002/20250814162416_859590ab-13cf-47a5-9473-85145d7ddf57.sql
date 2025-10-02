-- Create function for anonymous device trust check
CREATE OR REPLACE FUNCTION public.check_device_trust_anonymous(device_fingerprint_param text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  device_count INTEGER;
  result_json JSON;
BEGIN
  -- Check if device fingerprint exists and is active/valid
  SELECT COUNT(*) INTO device_count
  FROM public.trusted_devices
  WHERE device_fingerprint = device_fingerprint_param
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());
  
  -- Return structured result
  result_json := json_build_object(
    'success', true,
    'trusted', device_count > 0,
    'message', CASE 
      WHEN device_count > 0 THEN 'Device is trusted' 
      ELSE 'Device not found or not trusted' 
    END
  );
  
  RETURN result_json;
END;
$$;