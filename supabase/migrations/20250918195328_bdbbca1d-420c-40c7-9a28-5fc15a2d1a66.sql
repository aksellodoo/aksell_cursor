-- Add WhatsApp connection fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN whatsapp_phone text,
ADD COLUMN whatsapp_verified boolean DEFAULT false,
ADD COLUMN whatsapp_verification_code text,
ADD COLUMN whatsapp_verification_expires_at timestamp with time zone,
ADD COLUMN whatsapp_chat_id text,
ADD COLUMN notification_whatsapp boolean DEFAULT false;

-- Add indexes for WhatsApp fields
CREATE INDEX idx_profiles_whatsapp_phone ON public.profiles(whatsapp_phone);
CREATE INDEX idx_profiles_whatsapp_verified ON public.profiles(whatsapp_verified);

-- Function to clean expired WhatsApp verification codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_whatsapp_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    whatsapp_verification_code = NULL,
    whatsapp_verification_expires_at = NULL
  WHERE whatsapp_verification_expires_at IS NOT NULL 
    AND whatsapp_verification_expires_at < now();
END;
$$;