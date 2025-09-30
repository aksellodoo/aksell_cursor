-- Create a public function to check device trust without authentication
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
  device_count integer;
BEGIN
  -- Check if there's an active trusted device with this fingerprint
  SELECT COUNT(*) INTO device_count
  FROM public.trusted_devices
  WHERE device_fingerprint = device_fingerprint_param
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (client_ip_param IS NULL OR ip_address = client_ip_param);
  
  -- Update last_used_at if device is found
  IF device_count > 0 THEN
    UPDATE public.trusted_devices 
    SET last_used_at = now()
    WHERE device_fingerprint = device_fingerprint_param
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now());
  END IF;
  
  RETURN device_count > 0;
END;
$$;