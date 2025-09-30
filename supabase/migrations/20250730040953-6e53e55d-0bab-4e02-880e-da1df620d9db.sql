-- Create function to handle expired shares
CREATE OR REPLACE FUNCTION public.handle_expired_shares()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update expired shares
  UPDATE public.record_shares 
  SET status = 'expired'
  WHERE status = 'active' 
    AND expires_at IS NOT NULL 
    AND expires_at < now();
    
  -- Create notifications for users whose shared access has expired
  INSERT INTO public.app_notifications (user_id, type, title, message, data)
  SELECT 
    shared_with,
    'share_expired',
    'Acesso compartilhado expirou',
    'Seu acesso ao registro "' || record_name || '" expirou',
    jsonb_build_object(
      'share_id', id,
      'record_type', record_type,
      'record_id', record_id,
      'record_name', record_name,
      'expired_at', now()
    )
  FROM public.record_shares
  WHERE status = 'expired' 
    AND expires_at IS NOT NULL 
    AND expires_at BETWEEN (now() - INTERVAL '1 hour') AND now();
END;
$$;

-- Create function to notify about expiring shares (24h before expiry)
CREATE OR REPLACE FUNCTION public.notify_expiring_shares()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Notify about shares expiring in 24 hours
  INSERT INTO public.app_notifications (user_id, type, title, message, data)
  SELECT DISTINCT
    shared_with,
    'share_expiring',
    'Acesso compartilhado expira em breve',
    'Seu acesso ao registro "' || record_name || '" expira em 24 horas',
    jsonb_build_object(
      'share_id', id,
      'record_type', record_type,
      'record_id', record_id,
      'record_name', record_name,
      'expires_at', expires_at
    )
  FROM public.record_shares
  WHERE status = 'active' 
    AND expires_at IS NOT NULL 
    AND expires_at BETWEEN now() AND (now() + INTERVAL '24 hours')
    AND NOT EXISTS (
      -- Don't send duplicate notifications
      SELECT 1 FROM public.app_notifications 
      WHERE user_id = record_shares.shared_with 
        AND type = 'share_expiring'
        AND (data->>'share_id') = record_shares.id::text
        AND created_at > (now() - INTERVAL '25 hours')
    );
END;
$$;