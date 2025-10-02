-- 1. Atualizar tabela field_audit_log para ser universal
ALTER TABLE public.field_audit_log 
RENAME COLUMN user_id TO record_id;

-- 2. Atualizar função audit_profiles_changes para usar record_id
CREATE OR REPLACE FUNCTION public.audit_profiles_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Track name changes
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'name', OLD.name, NEW.name, auth.uid(), 'user');
  END IF;

  -- Track email changes
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'email', OLD.email, NEW.email, auth.uid(), 'user');
  END IF;

  -- Track role changes
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'role', OLD.role, NEW.role, auth.uid(), 'user');
  END IF;

  -- Track department changes (with readable names)
  IF OLD.department_id IS DISTINCT FROM NEW.department_id THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (
      NEW.id, 
      'department', 
      CASE WHEN OLD.department_id IS NULL THEN NULL ELSE public.get_department_name(OLD.department_id) END,
      CASE WHEN NEW.department_id IS NULL THEN NULL ELSE public.get_department_name(NEW.department_id) END,
      auth.uid(), 
      'user'
    );
  END IF;

  -- Track status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'status', OLD.status, NEW.status, auth.uid(), 'user');
  END IF;

  -- Track leadership changes
  IF OLD.is_leader IS DISTINCT FROM NEW.is_leader THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (
      NEW.id, 
      'is_leader', 
      CASE WHEN OLD.is_leader THEN 'Sim' ELSE 'Não' END,
      CASE WHEN NEW.is_leader THEN 'Sim' ELSE 'Não' END,
      auth.uid(), 
      'user'
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- 3. Criar trigger para profiles
DROP TRIGGER IF EXISTS profiles_audit_trigger ON public.profiles;
CREATE TRIGGER profiles_audit_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_profiles_changes();

-- 4. Criar função de auditoria para employees
CREATE OR REPLACE FUNCTION public.audit_employees_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Track name changes
  IF OLD.full_name IS DISTINCT FROM NEW.full_name THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'full_name', OLD.full_name, NEW.full_name, auth.uid(), 'employee');
  END IF;

  -- Track position changes
  IF OLD.position IS DISTINCT FROM NEW.position THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'position', OLD.position, NEW.position, auth.uid(), 'employee');
  END IF;

  -- Track department changes
  IF OLD.department_id IS DISTINCT FROM NEW.department_id THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (
      NEW.id, 
      'department', 
      CASE WHEN OLD.department_id IS NULL THEN NULL ELSE public.get_department_name(OLD.department_id) END,
      CASE WHEN NEW.department_id IS NULL THEN NULL ELSE public.get_department_name(NEW.department_id) END,
      auth.uid(), 
      'employee'
    );
  END IF;

  -- Track status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'status', OLD.status::text, NEW.status::text, auth.uid(), 'employee');
  END IF;

  -- Track salary changes
  IF OLD.salary IS DISTINCT FROM NEW.salary THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'salary', OLD.salary::text, NEW.salary::text, auth.uid(), 'employee');
  END IF;

  RETURN NEW;
END;
$function$;

-- 5. Criar trigger para employees
CREATE TRIGGER employees_audit_trigger
  AFTER UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.audit_employees_changes();

-- 6. Criar função de auditoria para departments
CREATE OR REPLACE FUNCTION public.audit_departments_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Track name changes
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'name', OLD.name, NEW.name, auth.uid(), 'department');
  END IF;

  -- Track description changes
  IF OLD.description IS DISTINCT FROM NEW.description THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'description', OLD.description, NEW.description, auth.uid(), 'department');
  END IF;

  -- Track color changes
  IF OLD.color IS DISTINCT FROM NEW.color THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'color', OLD.color, NEW.color, auth.uid(), 'department');
  END IF;

  RETURN NEW;
END;
$function$;

-- 7. Criar trigger para departments
CREATE TRIGGER departments_audit_trigger
  AFTER UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.audit_departments_changes();

-- 8. Criar função de auditoria para tasks
CREATE OR REPLACE FUNCTION public.audit_tasks_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Track title changes
  IF OLD.title IS DISTINCT FROM NEW.title THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'title', OLD.title, NEW.title, auth.uid(), 'task');
  END IF;

  -- Track description changes
  IF OLD.description IS DISTINCT FROM NEW.description THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'description', OLD.description, NEW.description, auth.uid(), 'task');
  END IF;

  -- Track status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'status', OLD.status, NEW.status, auth.uid(), 'task');
  END IF;

  -- Track priority changes
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'priority', OLD.priority, NEW.priority, auth.uid(), 'task');
  END IF;

  -- Track assigned_to changes
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'assigned_to', 
      (SELECT name FROM public.profiles WHERE id = OLD.assigned_to),
      (SELECT name FROM public.profiles WHERE id = NEW.assigned_to),
      auth.uid(), 'task');
  END IF;

  -- Track due_date changes
  IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (NEW.id, 'due_date', OLD.due_date::text, NEW.due_date::text, auth.uid(), 'task');
  END IF;

  RETURN NEW;
END;
$function$;

-- 9. Criar trigger para tasks
CREATE TRIGGER tasks_audit_trigger
  AFTER UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.audit_tasks_changes();