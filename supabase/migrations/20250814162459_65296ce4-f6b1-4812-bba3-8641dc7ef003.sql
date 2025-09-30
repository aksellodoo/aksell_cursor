-- Drop existing function and recreate with correct return type
DROP FUNCTION IF EXISTS public.check_device_trust_anonymous(text);

-- Create function for anonymous device trust check  
CREATE OR REPLACE FUNCTION public.check_device_trust_anonymous(device_fingerprint_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  device_count INTEGER;
BEGIN
  -- Check if device fingerprint exists and is active/valid
  SELECT COUNT(*) INTO device_count
  FROM public.trusted_devices
  WHERE device_fingerprint = device_fingerprint_param
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());
  
  -- Return true if trusted, false otherwise
  RETURN device_count > 0;
END;
$$;