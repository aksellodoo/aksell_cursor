-- Fix overly permissive RLS policies for tasks table
DROP POLICY IF EXISTS "Users can view tasks they are involved in" ON public.tasks;

CREATE POLICY "Users can view tasks they are involved in" ON public.tasks
FOR SELECT USING (
  auth.uid() = assigned_to OR 
  auth.uid() = created_by OR 
  auth.uid() = ANY(assigned_users) OR
  (assigned_department IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND department_id = tasks.assigned_department
  )) OR
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'hr', 'director')
  ))
);

-- Fix overly permissive RLS policies for departments table
DROP POLICY IF EXISTS "Departments can be created by authenticated users" ON public.departments;
DROP POLICY IF EXISTS "Departments can be updated by authenticated users" ON public.departments;
DROP POLICY IF EXISTS "Departments can be deleted by authenticated users" ON public.departments;

CREATE POLICY "Departments can be created by admins/directors" ON public.departments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'director')
  )
);

CREATE POLICY "Departments can be updated by admins/directors" ON public.departments
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'director')
  )
);

CREATE POLICY "Departments can be deleted by admins/directors" ON public.departments
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'director')
  )
);

-- Create security definer function to prevent RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role_and_department(user_id uuid)
RETURNS TABLE(user_role text, user_department uuid, is_user_leader boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT p.role, p.department_id, p.is_leader
  FROM public.profiles p 
  WHERE p.id = user_id;
END;
$$;

-- Add explicit deny policies for sensitive tables
CREATE POLICY "Deny anonymous access to password_reset_tokens" ON public.password_reset_tokens
FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to trusted_devices" ON public.trusted_devices
FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to field_audit_log" ON public.field_audit_log
FOR ALL TO anon USING (false);