-- Add can_change_password field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN can_change_password boolean NOT NULL DEFAULT true;

-- Create function for users to change their own password
CREATE OR REPLACE FUNCTION public.change_user_password(new_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_id uuid;
  result json;
BEGIN
  -- Get the current user ID
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'User not authenticated');
  END IF;
  
  -- Check if user can change password
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND can_change_password = true
  ) THEN
    RETURN json_build_object('success', false, 'message', 'User not allowed to change password');
  END IF;
  
  -- Update the user's password in auth.users
  UPDATE auth.users 
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = user_id;
  
  RETURN json_build_object('success', true, 'message', 'Password updated successfully');
END;
$$;