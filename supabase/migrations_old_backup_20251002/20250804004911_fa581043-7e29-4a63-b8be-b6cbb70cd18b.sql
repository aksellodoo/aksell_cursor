-- Add confidentiality fields to task_types table
ALTER TABLE public.task_types 
ADD COLUMN confidentiality_level confidentiality_level NOT NULL DEFAULT 'public',
ADD COLUMN allowed_users uuid[] DEFAULT NULL,
ADD COLUMN allowed_departments uuid[] DEFAULT NULL,
ADD COLUMN allowed_roles text[] DEFAULT NULL;

-- Create function to check task type access
CREATE OR REPLACE FUNCTION public.can_access_task_type(
  p_confidentiality_level confidentiality_level,
  p_allowed_users uuid[],
  p_allowed_departments uuid[],
  p_allowed_roles text[],
  p_user_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
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

-- Update RLS policy for task_types to consider confidentiality
DROP POLICY IF EXISTS "Users can view task types" ON public.task_types;

CREATE POLICY "Users can view accessible task types" 
ON public.task_types 
FOR SELECT 
USING (
  is_active = true AND 
  can_access_task_type(confidentiality_level, allowed_users, allowed_departments, allowed_roles, auth.uid())
);