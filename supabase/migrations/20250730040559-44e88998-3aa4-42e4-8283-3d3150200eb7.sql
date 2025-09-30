-- Drop and recreate functions properly
DROP FUNCTION IF EXISTS public.get_all_subordinates(uuid);

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