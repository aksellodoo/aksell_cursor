-- Correção urgente do sistema de auditoria - recriar triggers faltantes

-- 1. Recriar trigger para profiles (principal problema)
DROP TRIGGER IF EXISTS profiles_audit_trigger ON public.profiles;
CREATE TRIGGER profiles_audit_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_profiles_changes();

-- 2. Verificar e recriar trigger para employees
DROP TRIGGER IF EXISTS employees_audit_trigger ON public.employees;
CREATE TRIGGER employees_audit_trigger
  AFTER UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.audit_employees_changes();

-- 3. Verificar e recriar trigger para departments  
DROP TRIGGER IF EXISTS departments_audit_trigger ON public.departments;
CREATE TRIGGER departments_audit_trigger
  AFTER UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.audit_departments_changes();

-- 4. Verificar e recriar trigger para tasks
DROP TRIGGER IF EXISTS tasks_audit_trigger ON public.tasks;
CREATE TRIGGER tasks_audit_trigger
  AFTER UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.audit_tasks_changes();