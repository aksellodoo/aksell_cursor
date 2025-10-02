-- Drop and recreate the process_access_request_approval function without profile creation
DROP FUNCTION IF EXISTS public.process_access_request_approval;

CREATE OR REPLACE FUNCTION public.process_access_request_approval(
  request_id UUID,
  approved BOOLEAN,
  rejection_reason TEXT DEFAULT NULL,
  supervisor_id UUID DEFAULT NULL,
  edited_role TEXT DEFAULT NULL,
  edited_department TEXT DEFAULT NULL,
  edited_department_id UUID DEFAULT NULL,
  edited_notification_types JSONB DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  request_record RECORD;
  result JSON;
BEGIN
  -- Get the access request
  SELECT * INTO request_record
  FROM public.pending_access_requests 
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Solicitação não encontrada ou já processada'
    );
  END IF;
  
  -- Update the request status
  IF approved THEN
    UPDATE public.pending_access_requests 
    SET 
      status = 'approved',
      supervisor_id = COALESCE(process_access_request_approval.supervisor_id, request_record.supervisor_id)
    WHERE id = request_id;
    
    -- Return user data for the edge function to create auth user and profile
    result := json_build_object(
      'success', true,
      'user_id', gen_random_uuid(), -- Temporary ID, will be replaced by auth user ID
      'name', request_record.name,
      'email', request_record.email,
      'role', COALESCE(edited_role, request_record.role),
      'department', COALESCE(edited_department, request_record.department),
      'department_id', COALESCE(edited_department_id, request_record.department_id),
      'notification_types', COALESCE(edited_notification_types, jsonb_build_object(
        'changes', jsonb_build_object('app', request_record.notification_app, 'email', request_record.notification_email),
        'chatter', jsonb_build_object('app', request_record.notification_app, 'email', request_record.notification_email),
        'mentions', jsonb_build_object('app', request_record.notification_app, 'email', request_record.notification_email),
        'assignments', jsonb_build_object('app', request_record.notification_app, 'email', request_record.notification_email),
        'approvals', jsonb_build_object('app', request_record.notification_app, 'email', request_record.notification_email),
        'corrections', jsonb_build_object('app', request_record.notification_app, 'email', request_record.notification_email),
        'tasks', jsonb_build_object('app', request_record.notification_app, 'email', request_record.notification_email),
        'access_requests', jsonb_build_object('app', request_record.notification_app, 'email', request_record.notification_email)
      ))
    );
  ELSE
    -- Rejection
    UPDATE public.pending_access_requests 
    SET 
      status = 'rejected',
      rejection_reason = process_access_request_approval.rejection_reason,
      supervisor_id = COALESCE(process_access_request_approval.supervisor_id, request_record.supervisor_id)
    WHERE id = request_id;
    
    result := json_build_object(
      'success', true,
      'message', 'Solicitação rejeitada com sucesso'
    );
  END IF;
  
  -- Log the approval action
  INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
  VALUES (
    request_id,
    'access_request_status',
    'pending',
    CASE WHEN approved THEN 'approved' ELSE 'rejected' END,
    COALESCE(process_access_request_approval.supervisor_id, '00000000-0000-0000-0000-000000000000'::UUID),
    'access_request'
  );
  
  RETURN result;
END;
$$;