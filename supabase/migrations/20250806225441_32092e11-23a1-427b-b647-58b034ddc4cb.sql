-- Critical Security Fixes

-- 1. Add missing password_hash column to form_external_recipients
ALTER TABLE public.form_external_recipients 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 2. Create verify_password function for secure password verification
CREATE OR REPLACE FUNCTION public.verify_password(stored_hash text, provided_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Use crypt to verify password against stored hash
  RETURN stored_hash = crypt(provided_password, stored_hash);
END;
$$;

-- 3. Create can_access_form function for proper form access control
CREATE OR REPLACE FUNCTION public.can_access_form(
  p_confidentiality_level confidentiality_level,
  p_allowed_users uuid[],
  p_allowed_departments uuid[],
  p_allowed_roles text[],
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_department_id uuid;
  user_role text;
BEGIN
  -- If public, everyone can access
  IF p_confidentiality_level = 'public' THEN
    RETURN true;
  END IF;
  
  -- If no user_id provided, deny access for non-public forms
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get user's department and role
  SELECT department_id, role INTO user_department_id, user_role
  FROM public.profiles 
  WHERE id = p_user_id;
  
  -- Check if user is in allowed users
  IF p_allowed_users IS NOT NULL AND p_user_id = ANY(p_allowed_users) THEN
    RETURN true;
  END IF;
  
  -- Check if user's department is in allowed departments
  IF p_allowed_departments IS NOT NULL AND user_department_id = ANY(p_allowed_departments) THEN
    RETURN true;
  END IF;
  
  -- Check if user's role is in allowed roles
  IF p_allowed_roles IS NOT NULL AND user_role = ANY(p_allowed_roles) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- 4. Enable RLS on protheus_sa1010_80f17f00 table
ALTER TABLE public.protheus_sa1010_80f17f00 ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for protheus_sa1010_80f17f00 table
CREATE POLICY "Authenticated users can view protheus data" 
ON public.protheus_sa1010_80f17f00 
FOR SELECT 
TO authenticated
USING (true);

-- 6. Fix search_path on existing security-critical functions
ALTER FUNCTION public.get_department_name(uuid) SET search_path TO 'public';
ALTER FUNCTION public.process_access_request_approval(uuid, boolean, text) SET search_path TO 'public';