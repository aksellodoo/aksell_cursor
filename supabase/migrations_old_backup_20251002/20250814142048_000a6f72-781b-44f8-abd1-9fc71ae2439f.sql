-- Drop all versions of the conflicting function
DROP FUNCTION IF EXISTS public.check_device_trust_anonymous(text);
DROP FUNCTION IF EXISTS public.check_device_trust_anonymous(device_fingerprint_param text);

-- Create clean version of the function
CREATE OR REPLACE FUNCTION public.check_device_trust_anonymous(device_fingerprint_param text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_trusted boolean := false;
BEGIN
  -- Simple check for trusted device without any audit logging
  SELECT EXISTS (
    SELECT 1 FROM trusted_devices 
    WHERE device_fingerprint = device_fingerprint_param
      AND is_active = true 
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO is_trusted;
  
  RETURN is_trusted;
END;
$function$;