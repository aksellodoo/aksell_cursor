-- Create trusted_devices table for 2FA
CREATE TABLE public.trusted_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT NOT NULL,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, device_fingerprint)
);

-- Enable RLS
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

-- Users can view their own trusted devices
CREATE POLICY "Users can view own trusted devices" 
ON public.trusted_devices 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own trusted devices
CREATE POLICY "Users can create own trusted devices" 
ON public.trusted_devices 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own trusted devices
CREATE POLICY "Users can update own trusted devices" 
ON public.trusted_devices 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own trusted devices
CREATE POLICY "Users can delete own trusted devices" 
ON public.trusted_devices 
FOR DELETE 
USING (auth.uid() = user_id);

-- Admins can view all trusted devices
CREATE POLICY "Admins can view all trusted devices" 
ON public.trusted_devices 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.id = auth.uid() 
  AND p.role IN ('admin', 'director')
));

-- Add trust device settings to profiles
ALTER TABLE public.profiles 
ADD COLUMN trust_device_duration INTEGER DEFAULT 30,
ADD COLUMN max_trusted_devices INTEGER DEFAULT 5;

-- Function to cleanup expired trusted devices
CREATE OR REPLACE FUNCTION public.cleanup_expired_trusted_devices()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Remove expired devices
  DELETE FROM public.trusted_devices 
  WHERE expires_at < NOW() OR is_active = false;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log cleanup activity
  INSERT INTO public.field_audit_log (
    record_id, field_name, old_value, new_value, changed_by, record_type
  )
  VALUES (
    gen_random_uuid(),
    'trusted_devices_cleanup',
    deleted_count::text,
    'automatic_cleanup',
    '00000000-0000-0000-0000-000000000000',
    'system'
  );
  
  RETURN deleted_count;
END;
$function$;

-- Function to generate device fingerprint
CREATE OR REPLACE FUNCTION public.generate_device_fingerprint(
  user_agent_param TEXT,
  screen_resolution TEXT DEFAULT NULL,
  timezone_param TEXT DEFAULT NULL,
  language_param TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  fingerprint_data TEXT;
  fingerprint_hash TEXT;
BEGIN
  -- Combine device characteristics
  fingerprint_data := COALESCE(user_agent_param, '') || '|' || 
                     COALESCE(screen_resolution, '') || '|' || 
                     COALESCE(timezone_param, '') || '|' || 
                     COALESCE(language_param, '');
  
  -- Generate SHA-256 hash
  SELECT encode(digest(fingerprint_data, 'sha256'), 'hex') INTO fingerprint_hash;
  
  RETURN fingerprint_hash;
END;
$function$;

-- Function to check if device is trusted
CREATE OR REPLACE FUNCTION public.is_device_trusted(
  user_id_param UUID,
  device_fingerprint_param TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  is_trusted BOOLEAN := false;
BEGIN
  -- Check if device exists and is still valid
  SELECT EXISTS (
    SELECT 1 FROM public.trusted_devices td
    WHERE td.user_id = user_id_param
    AND td.device_fingerprint = device_fingerprint_param
    AND td.is_active = true
    AND td.expires_at > NOW()
  ) INTO is_trusted;
  
  -- Update last_used_at if device is trusted
  IF is_trusted THEN
    UPDATE public.trusted_devices
    SET last_used_at = NOW()
    WHERE user_id = user_id_param
    AND device_fingerprint = device_fingerprint_param;
  END IF;
  
  RETURN is_trusted;
END;
$function$;