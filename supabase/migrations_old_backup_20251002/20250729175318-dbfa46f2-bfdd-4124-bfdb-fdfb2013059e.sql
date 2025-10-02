-- Atualizar função de alteração de senha para validar 10 caracteres mínimo
CREATE OR REPLACE FUNCTION public.change_user_password(new_password text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_id uuid;
  result json;
  user_profile record;
BEGIN
  -- Get the current user ID
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'User not authenticated');
  END IF;
  
  -- Get user profile with additional security checks
  SELECT * INTO user_profile 
  FROM public.profiles 
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'User profile not found');
  END IF;
  
  -- Check if user can change password and account is active
  IF NOT user_profile.can_change_password OR user_profile.status != 'active' THEN
    RETURN json_build_object('success', false, 'message', 'User not allowed to change password');
  END IF;
  
  -- Validate password strength (minimum 10 characters)
  IF length(new_password) < 10 THEN
    RETURN json_build_object('success', false, 'message', 'Password must be at least 10 characters long');
  END IF;
  
  -- Update the user's password in auth.users
  UPDATE auth.users 
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = user_id;
  
  -- Log the password change for audit
  INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
  VALUES (user_id, 'password_changed', 'hidden', 'hidden', user_id, 'user');
  
  RETURN json_build_object('success', true, 'message', 'Password updated successfully');
END;
$function$;