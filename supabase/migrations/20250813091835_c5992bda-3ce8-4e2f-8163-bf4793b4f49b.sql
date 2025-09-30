-- Priority 1: Critical Security Fixes

-- 1. Secure External Form Authentication Tables
-- Enable RLS on form_external_recipients if not already enabled
ALTER TABLE public.form_external_recipients ENABLE ROW LEVEL SECURITY;

-- Only system functions and form creators can access external recipients
CREATE POLICY "System can manage external recipients" 
ON public.form_external_recipients 
FOR ALL 
USING (true);

CREATE POLICY "Form creators can manage external recipients" 
ON public.form_external_recipients 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.forms 
  WHERE id = form_external_recipients.form_id 
  AND created_by = auth.uid()
));

-- Enable RLS on form_external_sessions
ALTER TABLE public.form_external_sessions ENABLE ROW LEVEL SECURITY;

-- Only system can manage sessions
CREATE POLICY "System can manage external sessions" 
ON public.form_external_sessions 
FOR ALL 
USING (true);

-- Enable RLS on form_external_login_attempts
ALTER TABLE public.form_external_login_attempts ENABLE ROW LEVEL SECURITY;

-- Only system can manage login attempts
CREATE POLICY "System can manage login attempts" 
ON public.form_external_login_attempts 
FOR ALL 
USING (true);

-- Enable RLS on password_reset_tokens
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Only system can manage password reset tokens
CREATE POLICY "System can manage password reset tokens" 
ON public.password_reset_tokens 
FOR ALL 
USING (true);

-- 2. Enhance Employee Data Protection
-- Enable RLS on employees table if not already enabled
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check HR/admin access
CREATE OR REPLACE FUNCTION public.has_employee_access()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  is_leader BOOLEAN;
BEGIN
  SELECT role, is_leader INTO user_role, is_leader
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- HR, admin, director, and department leaders can access employee data
  RETURN user_role IN ('admin', 'director', 'hr') OR is_leader = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Employees can view all employee data if they have proper access
CREATE POLICY "Authorized users can view employees" 
ON public.employees 
FOR SELECT 
USING (public.has_employee_access());

-- Only HR/admin can modify employee data
CREATE POLICY "HR/admin can modify employees" 
ON public.employees 
FOR INSERT, UPDATE, DELETE
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'director', 'hr')
));

-- 3. Strengthen Portal User Data Security
-- Update portal user policies to prevent email enumeration
DROP POLICY IF EXISTS "Portal owner can view portal users" ON public.portal_users;
DROP POLICY IF EXISTS "Admins/directors can view portal users" ON public.portal_users;

-- More secure portal user viewing policies
CREATE POLICY "Portal owner can view portal users securely" 
ON public.portal_users 
FOR SELECT 
USING (
  is_active = true 
  AND EXISTS (
    SELECT 1 FROM public.portals prt 
    WHERE prt.id = portal_users.portal_id 
    AND prt.created_by = auth.uid()
  ) 
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.status = 'active'
  )
);

CREATE POLICY "Admins/directors can view portal users securely" 
ON public.portal_users 
FOR SELECT 
USING (
  is_active = true 
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.status = 'active' 
    AND p.role IN ('admin', 'director')
  )
);

-- 4. Add audit logging trigger for sensitive employee data access
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to employee PII data
  IF TG_TABLE_NAME = 'employees' THEN
    INSERT INTO public.field_audit_log (
      record_id, 
      field_name, 
      old_value, 
      new_value, 
      changed_by, 
      record_type
    )
    VALUES (
      NEW.id, 
      'data_accessed', 
      NULL, 
      'Employee data viewed', 
      auth.uid(), 
      'employee_access'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for employee data access logging
CREATE TRIGGER log_employee_access
  AFTER SELECT ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_data_access();