-- Create trigger function for record sharing notifications
CREATE OR REPLACE FUNCTION public.notify_record_shared()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  shared_by_name TEXT;
  shared_with_name TEXT;
BEGIN
  -- Get names for notification
  SELECT name INTO shared_by_name FROM public.profiles WHERE id = NEW.shared_by;
  SELECT name INTO shared_with_name FROM public.profiles WHERE id = NEW.shared_with;
  
  -- Create notification for the person receiving the share
  INSERT INTO public.app_notifications (user_id, type, title, message, data)
  VALUES (
    NEW.shared_with,
    'record_shared',
    shared_by_name || ' compartilhou um registro com você',
    'Registro "' || NEW.record_name || '" foi compartilhado com você',
    jsonb_build_object(
      'share_id', NEW.id,
      'record_type', NEW.record_type,
      'record_id', NEW.record_id,
      'record_name', NEW.record_name,
      'shared_by', NEW.shared_by,
      'shared_by_name', shared_by_name,
      'permissions', NEW.permissions
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for record sharing notifications
DROP TRIGGER IF EXISTS trigger_notify_record_shared ON public.record_shares;
CREATE TRIGGER trigger_notify_record_shared
  AFTER INSERT ON public.record_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_record_shared();