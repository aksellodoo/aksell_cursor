-- Fix syntax error in previous migration - PostgreSQL doesn't support comma-separated operations in single policy

-- Remove the invalid SELECT trigger
DROP TRIGGER IF EXISTS log_employee_access ON public.employees;

-- Create proper audit logging function for employee data access
CREATE OR REPLACE FUNCTION public.log_employee_data_access(employee_id UUID, access_type TEXT DEFAULT 'view')
RETURNS VOID AS $$
BEGIN
  -- Only log if user is authenticated
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.field_audit_log (
      record_id, 
      field_name, 
      old_value, 
      new_value, 
      changed_by, 
      record_type
    )
    VALUES (
      employee_id, 
      'sensitive_data_access', 
      NULL, 
      access_type, 
      auth.uid(), 
      'employee_audit'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user can access employee sensitive data
CREATE OR REPLACE FUNCTION public.can_access_employee_sensitive_data()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- Only HR, admin, and director can access sensitive employee data
  RETURN user_role IN ('admin', 'director', 'hr');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Secure approval_tokens table
ALTER TABLE public.approval_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage approval tokens" 
ON public.approval_tokens 
FOR ALL 
USING (true);

CREATE POLICY "Users can view own approval tokens" 
ON public.approval_tokens 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.workflow_executions we 
    WHERE we.id = approval_tokens.execution_id 
    AND we.triggered_by = auth.uid()
  )
);

-- Fix form external recipients policies (separate policies for each operation)
DROP POLICY IF EXISTS "System can manage external recipients" ON public.form_external_recipients;
DROP POLICY IF EXISTS "Form creators can manage external recipients" ON public.form_external_recipients;

CREATE POLICY "System functions can manage external recipients" 
ON public.form_external_recipients 
FOR ALL 
TO service_role
USING (true);

CREATE POLICY "Form creators can view their external recipients" 
ON public.form_external_recipients 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.forms 
  WHERE id = form_external_recipients.form_id 
  AND created_by = auth.uid()
));

CREATE POLICY "Form creators can insert external recipients" 
ON public.form_external_recipients 
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.forms 
  WHERE id = form_external_recipients.form_id 
  AND created_by = auth.uid()
));

CREATE POLICY "Form creators can update external recipients" 
ON public.form_external_recipients 
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.forms 
  WHERE id = form_external_recipients.form_id 
  AND created_by = auth.uid()
));

CREATE POLICY "Form creators can delete external recipients" 
ON public.form_external_recipients 
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.forms 
  WHERE id = form_external_recipients.form_id 
  AND created_by = auth.uid()
));

-- Add rate limiting function for external form access
CREATE OR REPLACE FUNCTION public.check_external_form_rate_limit(form_id UUID, client_ip TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  -- Count attempts in the last hour
  SELECT COUNT(*) INTO attempt_count
  FROM public.form_external_login_attempts
  WHERE form_id = check_external_form_rate_limit.form_id
    AND client_ip = check_external_form_rate_limit.client_ip
    AND created_at > NOW() - INTERVAL '1 hour';
  
  -- Allow up to 10 attempts per hour per IP
  RETURN attempt_count < 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;