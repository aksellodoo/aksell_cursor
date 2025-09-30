-- Create field audit log table for Odoo-style tracking
CREATE TABLE public.field_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  record_type TEXT NOT NULL DEFAULT 'profile',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.field_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Audit logs are viewable by authenticated users" 
ON public.field_audit_log 
FOR SELECT 
USING (true);

CREATE POLICY "Audit logs can be inserted by authenticated users" 
ON public.field_audit_log 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Audit logs can be deleted by authenticated users" 
ON public.field_audit_log 
FOR DELETE 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_field_audit_log_user_id ON public.field_audit_log(user_id);
CREATE INDEX idx_field_audit_log_timestamp ON public.field_audit_log(timestamp DESC);
CREATE INDEX idx_field_audit_log_field_name ON public.field_audit_log(field_name);

-- Function to get readable department name
CREATE OR REPLACE FUNCTION public.get_department_name(dept_id UUID)
RETURNS TEXT AS $$
  SELECT name FROM public.departments WHERE id = dept_id;
$$ LANGUAGE SQL STABLE;

-- Trigger function for profiles audit
CREATE OR REPLACE FUNCTION public.audit_profiles_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Track name changes
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    INSERT INTO public.field_audit_log (user_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'name', OLD.name, NEW.name, auth.uid(), 'profile');
  END IF;

  -- Track email changes
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    INSERT INTO public.field_audit_log (user_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'email', OLD.email, NEW.email, auth.uid(), 'profile');
  END IF;

  -- Track role changes
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.field_audit_log (user_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'role', OLD.role, NEW.role, auth.uid(), 'profile');
  END IF;

  -- Track department changes (with readable names)
  IF OLD.department_id IS DISTINCT FROM NEW.department_id THEN
    INSERT INTO public.field_audit_log (user_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (
      NEW.id, 
      'department', 
      CASE WHEN OLD.department_id IS NULL THEN NULL ELSE public.get_department_name(OLD.department_id) END,
      CASE WHEN NEW.department_id IS NULL THEN NULL ELSE public.get_department_name(NEW.department_id) END,
      auth.uid(), 
      'profile'
    );
  END IF;

  -- Track status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.field_audit_log (user_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'status', OLD.status, NEW.status, auth.uid(), 'profile');
  END IF;

  -- Track leadership changes
  IF OLD.is_leader IS DISTINCT FROM NEW.is_leader THEN
    INSERT INTO public.field_audit_log (user_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (
      NEW.id, 
      'is_leader', 
      CASE WHEN OLD.is_leader THEN 'Sim' ELSE 'Não' END,
      CASE WHEN NEW.is_leader THEN 'Sim' ELSE 'Não' END,
      auth.uid(), 
      'profile'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for profiles table
CREATE TRIGGER profiles_audit_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profiles_changes();

-- Function to get audit log size in bytes
CREATE OR REPLACE FUNCTION public.get_audit_log_size()
RETURNS BIGINT AS $$
  SELECT pg_total_relation_size('public.field_audit_log');
$$ LANGUAGE SQL STABLE;

-- Function to get audit log count
CREATE OR REPLACE FUNCTION public.get_audit_log_count()
RETURNS BIGINT AS $$
  SELECT COUNT(*) FROM public.field_audit_log;
$$ LANGUAGE SQL STABLE;

-- Function to clean old audit logs
CREATE OR REPLACE FUNCTION public.clean_audit_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.field_audit_log 
  WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;