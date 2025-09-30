-- Create access_rejections table to log rejections
CREATE TABLE public.access_rejections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_request_id UUID NOT NULL,
  rejected_by UUID NOT NULL REFERENCES auth.users(id),
  rejection_reason TEXT,
  rejected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  requested_role TEXT NOT NULL,
  requested_department TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.access_rejections ENABLE ROW LEVEL SECURITY;

-- Create policies for access_rejections
CREATE POLICY "Admins and directors can view all rejections" 
ON public.access_rejections 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'director')
));

CREATE POLICY "System can create rejections" 
ON public.access_rejections 
FOR INSERT 
WITH CHECK (true);

-- Add unique constraint to prevent duplicate pending requests per email
ALTER TABLE public.pending_access_requests 
ADD CONSTRAINT unique_pending_email_request 
UNIQUE (email, status) 
DEFERRABLE INITIALLY DEFERRED;

-- Update the process_access_request_approval function with new logic
CREATE OR REPLACE FUNCTION public.process_access_request_approval(
  request_id uuid, 
  approved boolean, 
  rejection_reason text DEFAULT NULL::text, 
  supervisor_id uuid DEFAULT NULL::uuid, 
  edited_data jsonb DEFAULT NULL::jsonb
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
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
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
    AND data->>'access_request_id' = request_record.id::text;
    
    -- Delete the request (silently)
    DELETE FROM public.pending_access_requests WHERE id = request_record.id;
    
    RETURN json_build_object('success', true, 'message', 'Solicitação rejeitada');
  END IF;

  -- Handle APPROVAL - Keep existing logic
  -- Prepare user data with any edits
  user_data := jsonb_build_object(
    'name', COALESCE(edited_data->>'name', request_record.name),
    'email', request_record.email,
    'role', COALESCE(edited_data->>'role', request_record.role),
    'department', COALESCE(edited_data->>'department', request_record.department),
    'department_id', COALESCE(edited_data->>'department_id', request_record.department_id),
    'supervisor_id', supervisor_id,
    'notification_email', request_record.notification_email,
    'notification_app', request_record.notification_app,
    'notification_frequency', request_record.notification_frequency
  );

  -- Generate temporary password
  temp_password := public.generate_secure_password();

  -- Create user in auth.users
  INSERT INTO auth.users (
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    request_record.email,
    crypt(temp_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('name', user_data->>'name'),
    now(),
    now(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO new_user_id;

  -- Create or update profile
  INSERT INTO public.profiles (
    id,
    name,
    email,
    role,
    department,
    department_id,
    supervisor_id,
    notification_email,
    notification_app,
    notification_frequency,
    status,
    created_by
  ) VALUES (
    new_user_id,
    user_data->>'name',
    user_data->>'email',
    user_data->>'role',
    user_data->>'department',
    (user_data->>'department_id')::uuid,
    (user_data->>'supervisor_id')::uuid,
    (user_data->>'notification_email')::boolean,
    (user_data->>'notification_app')::boolean,
    user_data->>'notification_frequency',
    'active',
    current_user_id
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    department_id = EXCLUDED.department_id,
    supervisor_id = EXCLUDED.supervisor_id,
    notification_email = EXCLUDED.notification_email,
    notification_app = EXCLUDED.notification_app,
    notification_frequency = EXCLUDED.notification_frequency,
    updated_at = now();

  -- Generate password reset token
  reset_token := encode(gen_random_bytes(32), 'base64');
  reset_token := replace(replace(replace(reset_token, '+', '-'), '/', '_'), '=', '');
  
  SELECT encode(digest(reset_token, 'sha256'), 'hex') INTO token_hash;
  
  INSERT INTO public.password_reset_tokens (user_id, token_hash, reset_type, created_by)
  VALUES (new_user_id, token_hash, 'new_user_setup', current_user_id);

  -- Clean up notifications and pending request
  DELETE FROM public.app_notifications 
  WHERE type = 'access_request' 
  AND data->>'access_request_id' = request_record.id::text;
  
  DELETE FROM public.pending_access_requests WHERE id = request_record.id;
  
  -- Log successful approval
  INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
  VALUES (new_user_id, 'access_request_approved', 'pending', 'approved', current_user_id, 'user');

  RETURN json_build_object(
    'success', true, 
    'message', 'Usuário criado com sucesso',
    'user_id', new_user_id,
    'reset_token', reset_token
  );
END;
$function$;