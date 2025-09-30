-- Fix the process_access_request_approval function to handle audit log foreign key constraint
CREATE OR REPLACE FUNCTION public.process_access_request_approval(
  request_id UUID,
  approved BOOLEAN,
  rejection_reason TEXT DEFAULT NULL,
  supervisor_id UUID DEFAULT NULL,
  edited_data JSONB DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  request_record RECORD;
  user_data JSONB;
  result JSON;
  temp_password TEXT;
  new_user_id UUID;
  reset_token TEXT;
  token_hash TEXT;
  current_user_id UUID;
BEGIN
  -- Get current user ID, fallback to system user if not authenticated
  current_user_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID);
  
  -- Ensure system user exists in profiles for audit logging
  INSERT INTO public.profiles (id, name, email, role, department, status)
  VALUES (
    '00000000-0000-0000-0000-000000000000'::UUID,
    'Sistema',
    'sistema@internal.local',
    'admin',
    'Sistema',
    'active'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Get the access request
  SELECT * INTO request_record
  FROM public.pending_access_requests
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Solicitação não encontrada ou já processada');
  END IF;

  -- Prepare user data with any edits
  user_data := jsonb_build_object(
    'name', COALESCE(edited_data->>'name', request_record.name),
    'email', request_record.email,
    'role', COALESCE(edited_data->>'role', request_record.role),
    'department', COALESCE(edited_data->>'department', request_record.department),
    'department_id', COALESCE((edited_data->>'department_id')::UUID, request_record.department_id),
    'supervisor_id', COALESCE(supervisor_id, request_record.supervisor_id),
    'notification_email', COALESCE((edited_data->>'notification_email')::BOOLEAN, request_record.notification_email),
    'notification_app', COALESCE((edited_data->>'notification_app')::BOOLEAN, request_record.notification_app),
    'notification_frequency', COALESCE(edited_data->>'notification_frequency', request_record.notification_frequency)
  );

  IF approved THEN
    -- Update request status
    UPDATE public.pending_access_requests
    SET 
      status = 'approved',
      supervisor_id = supervisor_id
    WHERE id = request_id;

    -- Create user in auth if approved
    -- This would be handled by the edge function calling Supabase Auth
    
    result := json_build_object(
      'success', true,
      'message', 'Solicitação aprovada com sucesso',
      'user_data', user_data
    );
  ELSE
    -- Update request status to rejected
    UPDATE public.pending_access_requests
    SET 
      status = 'rejected',
      rejection_reason = rejection_reason
    WHERE id = request_id;

    result := json_build_object(
      'success', true,
      'message', 'Solicitação rejeitada'
    );
  END IF;

  -- Log the approval/rejection with proper user ID
  INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
  VALUES (
    request_id,
    'access_request_status',
    'pending',
    CASE WHEN approved THEN 'approved' ELSE 'rejected' END,
    current_user_id,
    'access_request'
  );

  -- Clean up related notifications
  DELETE FROM public.app_notifications
  WHERE data::jsonb @> jsonb_build_object('access_request_id', request_id::text);

  RETURN result;
END;
$$;