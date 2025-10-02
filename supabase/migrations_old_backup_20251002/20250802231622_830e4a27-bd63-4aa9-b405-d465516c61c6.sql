-- Update the process_access_request_approval function to accept current_user_id as parameter
CREATE OR REPLACE FUNCTION public.process_access_request_approval(
  request_id uuid, 
  approved boolean, 
  rejection_reason text DEFAULT NULL::text, 
  supervisor_id uuid DEFAULT NULL::uuid, 
  edited_data jsonb DEFAULT NULL::jsonb,
  current_user_id uuid DEFAULT NULL::uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  request_record RECORD;
  user_data JSONB;
  result JSON;
  temp_password TEXT;
  new_user_id UUID;
  reset_token TEXT;
  token_hash TEXT;
BEGIN
  -- Validate current user ID is provided
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Usuário não autenticado');
  END IF;

  -- Get the access request
  SELECT * INTO request_record
  FROM public.pending_access_requests
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Solicitação não encontrada ou já processada');
  END IF;

  -- Handle REJECTION - Simple and silent
  IF NOT approved THEN
    -- Log the rejection
    INSERT INTO public.access_rejections (
      original_request_id,
      rejected_by,
      rejection_reason,
      requester_name,
      requester_email,
      requested_role,
      requested_department
    ) VALUES (
      request_record.id,
      current_user_id,
      rejection_reason,
      request_record.name,
      request_record.email,
      request_record.role,
      request_record.department
    );
    
    -- Delete related notifications
    DELETE FROM public.app_notifications
    WHERE type = 'access_request' 
      AND (data->>'access_request_id') = request_record.id::text;
    
    -- Delete the request (this will free up the email for new requests)
    DELETE FROM public.pending_access_requests 
    WHERE id = request_record.id;
    
    RETURN json_build_object('success', true, 'message', 'Solicitação rejeitada com sucesso');
  END IF;

  -- Handle APPROVAL - existing logic continues...
  -- Prepare user data for creation
  user_data := jsonb_build_object(
    'name', COALESCE((edited_data->>'name')::text, request_record.name),
    'email', request_record.email,
    'role', COALESCE((edited_data->>'role')::text, request_record.role),
    'department', COALESCE((edited_data->>'department')::text, request_record.department),
    'department_id', COALESCE((edited_data->>'department_id')::uuid, request_record.department_id),
    'supervisor_id', supervisor_id,
    'notification_email', request_record.notification_email,
    'notification_app', request_record.notification_app,
    'notification_frequency', request_record.notification_frequency,
    'status', 'pending_password'
  );

  -- Log the approval
  INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
  VALUES (
    request_record.id,
    'access_request_approved',
    'pending',
    'approved',
    current_user_id,
    'access_request'
  );

  -- Delete related notifications
  DELETE FROM public.app_notifications
  WHERE type = 'access_request' 
    AND (data->>'access_request_id') = request_record.id::text;

  -- Update request status to approved
  UPDATE public.pending_access_requests
  SET status = 'approved'
  WHERE id = request_record.id;

  RETURN json_build_object(
    'success', true, 
    'message', 'Usuário aprovado com sucesso',
    'user_data', user_data
  );
END;
$function$;