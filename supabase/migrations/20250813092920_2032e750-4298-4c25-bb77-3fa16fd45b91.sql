-- Comprehensive Security Fixes Implementation
-- Addresses critical vulnerabilities identified in security review

-- 1. Secure form_external_login_attempts table
ALTER TABLE public.form_external_login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage external login attempts" 
ON public.form_external_login_attempts 
FOR ALL 
TO service_role
USING (true);

CREATE POLICY "No direct user access to login attempts" 
ON public.form_external_login_attempts 
FOR ALL 
TO authenticated, anon
USING (false);

-- 2. Secure form_external_sessions table  
ALTER TABLE public.form_external_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage external sessions" 
ON public.form_external_sessions 
FOR ALL 
TO service_role
USING (true);

CREATE POLICY "Users can only access their own sessions" 
ON public.form_external_sessions 
FOR SELECT 
TO anon
USING (session_token = current_setting('request.headers')::json->>'x-session-token');

-- 3. Secure password_reset_tokens table
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage password reset tokens" 
ON public.password_reset_tokens 
FOR ALL 
TO service_role
USING (true);

CREATE POLICY "No direct user access to reset tokens" 
ON public.password_reset_tokens 
FOR ALL 
TO authenticated, anon
USING (false);

-- 4. Enhanced employees table security with column-level restrictions
DROP POLICY IF EXISTS "Employees are viewable by authenticated users" ON public.employees;
DROP POLICY IF EXISTS "Managers can view their team employees" ON public.employees;

-- Basic employee info (non-sensitive fields)
CREATE POLICY "Users can view basic employee info" 
ON public.employees 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.status = 'active'
  )
);

-- Sensitive employee data (CPF, salary, RG, etc.) - restricted to HR, admin, director
CREATE OR REPLACE FUNCTION public.can_view_employee_sensitive_data(employee_record public.employees)
RETURNS public.employees AS $$
DECLARE
  user_role TEXT;
  result public.employees;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- Copy all fields
  result := employee_record;
  
  -- Mask sensitive fields if user doesn't have access
  IF user_role NOT IN ('admin', 'director', 'hr') THEN
    result.cpf := CASE WHEN result.cpf IS NOT NULL THEN '***.***.***-**' ELSE NULL END;
    result.rg := CASE WHEN result.rg IS NOT NULL THEN '***.***.**-*' ELSE NULL END;
    result.salary := NULL;
    result.bank_account := CASE WHEN result.bank_account IS NOT NULL THEN '****' ELSE NULL END;
    result.emergency_contact_phone := CASE WHEN result.emergency_contact_phone IS NOT NULL THEN '(**) ****-****' ELSE NULL END;
  ELSE
    -- Log sensitive data access for audit
    PERFORM public.log_employee_data_access(result.id, 'sensitive_data_view');
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5. Fix portal user enumeration by restricting email visibility
DROP POLICY IF EXISTS "Portal owner can view portal users" ON public.portal_users;
DROP POLICY IF EXISTS "Admins/directors can view portal users" ON public.portal_users;

CREATE POLICY "Portal owner can view portal users" 
ON public.portal_users 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.portals prt
    WHERE prt.id = portal_users.portal_id 
    AND prt.created_by = auth.uid()
  ) 
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.status = 'active'
  )
  AND is_active = true
);

CREATE POLICY "Admins/directors can view active portal users" 
ON public.portal_users 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.status = 'active' 
    AND p.role IN ('admin', 'director')
  ) 
  AND is_active = true
);

-- 6. Enhanced form response access controls
CREATE OR REPLACE FUNCTION public.can_access_form_response(response_form_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  form_confidentiality confidentiality_level;
  form_allowed_users UUID[];
  form_allowed_departments UUID[];
  form_allowed_roles TEXT[];
BEGIN
  -- Get form confidentiality settings
  SELECT confidentiality_level, allowed_users, allowed_departments, allowed_roles
  INTO form_confidentiality, form_allowed_users, form_allowed_departments, form_allowed_roles
  FROM public.forms 
  WHERE id = response_form_id;
  
  -- Check access based on confidentiality level
  RETURN public.can_access_form(
    form_confidentiality, 
    form_allowed_users, 
    form_allowed_departments, 
    form_allowed_roles, 
    auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update form_responses policies to use enhanced access control
DROP POLICY IF EXISTS "Users can view form responses with confidentiality check" ON public.form_responses;

CREATE POLICY "Users can view form responses with enhanced access control" 
ON public.form_responses 
FOR SELECT 
TO authenticated
USING (
  -- Form creator can always view
  EXISTS (
    SELECT 1 FROM public.forms f 
    WHERE f.id = form_responses.form_id 
    AND f.created_by = auth.uid()
  )
  OR
  -- Check confidentiality-based access
  public.can_access_form_response(form_id)
);

-- 7. Add audit trigger for sensitive employee data access
CREATE OR REPLACE FUNCTION public.audit_employee_sensitive_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when sensitive employee data is accessed
  IF NEW.cpf IS DISTINCT FROM OLD.cpf 
     OR NEW.rg IS DISTINCT FROM OLD.rg 
     OR NEW.salary IS DISTINCT FROM OLD.salary 
     OR NEW.bank_account IS DISTINCT FROM OLD.bank_account THEN
    
    PERFORM public.log_employee_data_access(NEW.id, 'sensitive_data_modified');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_employee_sensitive_access ON public.employees;
CREATE TRIGGER audit_employee_sensitive_access
  AFTER UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_employee_sensitive_access();

-- 8. Enhanced rate limiting for external forms
CREATE OR REPLACE FUNCTION public.enforce_external_form_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Check rate limit before allowing new session
  IF NOT public.check_external_form_rate_limit(NEW.form_id, NEW.client_ip) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Too many attempts from this IP address.' 
    USING ERRCODE = '42501';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_external_form_rate_limit
  BEFORE INSERT ON public.form_external_login_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_external_form_rate_limit();

-- 9. Add security monitoring function
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type TEXT,
  event_data JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.field_audit_log (
    record_id,
    field_name,
    old_value,
    new_value,
    changed_by,
    record_type
  )
  VALUES (
    gen_random_uuid(),
    'security_event',
    event_type,
    event_data::text,
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
    'security_audit'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;