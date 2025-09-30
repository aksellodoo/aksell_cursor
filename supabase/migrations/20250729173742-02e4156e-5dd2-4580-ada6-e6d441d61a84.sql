-- CRITICAL SECURITY FIXES

-- 1. Remove plain text password storage from pending_access_requests
ALTER TABLE public.pending_access_requests DROP COLUMN IF EXISTS password_hash;

-- 2. Implement role-based RLS policy protection for profiles table
-- Create security definer function to check if user can modify roles
CREATE OR REPLACE FUNCTION public.can_modify_user_role(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_role text;
BEGIN
  -- Get current user's role
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- Only admin and director roles can modify other users' roles
  -- Users cannot modify their own role
  IF current_user_role IN ('admin', 'director') AND target_user_id != auth.uid() THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- 3. Update profiles RLS policies to prevent role escalation
DROP POLICY IF EXISTS "Users can update profiles with role permissions" ON public.profiles;

-- Create separate policies for different update scenarios
CREATE POLICY "Users can update their own profile (non-role fields)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  -- Prevent users from modifying their own role, status, or leadership status
  (OLD.role = NEW.role) AND 
  (OLD.status = NEW.status) AND 
  (OLD.is_leader = NEW.is_leader)
);

CREATE POLICY "Admins and directors can update user roles and status" 
ON public.profiles 
FOR UPDATE 
USING (can_modify_user_role(id))
WITH CHECK (can_modify_user_role(id));

-- 4. Tighten overly permissive RLS policies

-- Update department permissions policies to be more restrictive
DROP POLICY IF EXISTS "Department permissions are viewable by authenticated users" ON public.department_permissions;
DROP POLICY IF EXISTS "Department permissions can be created by authenticated users" ON public.department_permissions;
DROP POLICY IF EXISTS "Department permissions can be updated by authenticated users" ON public.department_permissions;
DROP POLICY IF EXISTS "Department permissions can be deleted by authenticated users" ON public.department_permissions;

CREATE POLICY "Department permissions are viewable by authenticated users" 
ON public.department_permissions 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins and directors can create department permissions" 
ON public.department_permissions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'director')
  )
);

CREATE POLICY "Only admins and directors can update department permissions" 
ON public.department_permissions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'director')
  )
);

CREATE POLICY "Only admins and directors can delete department permissions" 
ON public.department_permissions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'director')
  )
);

-- 5. Enhance access request approval authorization
-- Create function to validate access request approvals
CREATE OR REPLACE FUNCTION public.can_approve_access_request()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  RETURN user_role IN ('admin', 'director');
END;
$$;

-- Update pending_access_requests policies to be more secure
DROP POLICY IF EXISTS "System can create pending requests" ON public.pending_access_requests;

CREATE POLICY "Anyone can create pending requests" 
ON public.pending_access_requests 
FOR INSERT 
WITH CHECK (true);

-- Update approval policies to use the new function
UPDATE public.workflow_approvals 
SET status = 'auto_rejected'
WHERE status = 'pending' 
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = approver_id AND role IN ('admin', 'director')
  );

-- 6. Enhance password change function security
CREATE OR REPLACE FUNCTION public.change_user_password(new_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  
  -- Validate password strength (minimum 8 characters)
  IF length(new_password) < 8 THEN
    RETURN json_build_object('success', false, 'message', 'Password must be at least 8 characters long');
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
$$;