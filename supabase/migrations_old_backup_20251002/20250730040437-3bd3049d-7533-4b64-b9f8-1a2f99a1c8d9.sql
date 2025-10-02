-- Fix security warning: add SECURITY DEFINER to functions missing it
CREATE OR REPLACE FUNCTION public.check_shared_record_access(
  p_record_type text,
  p_record_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if user has access to the record through sharing
  RETURN EXISTS (
    SELECT 1 
    FROM public.record_shares 
    WHERE record_type = p_record_type 
      AND record_id = p_record_id 
      AND shared_with = p_user_id 
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$;

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

-- Create function to get all subordinates (for hierarchical sharing)
CREATE OR REPLACE FUNCTION public.get_all_subordinates(supervisor_id uuid)
RETURNS TABLE(subordinate_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE subordinates AS (
    -- Base case: direct subordinates
    SELECT id FROM public.profiles WHERE supervisor_id = $1
    UNION
    -- Recursive case: subordinates of subordinates
    SELECT p.id 
    FROM public.profiles p
    INNER JOIN subordinates s ON p.supervisor_id = s.id
  )
  SELECT id FROM subordinates;
END;
$$;