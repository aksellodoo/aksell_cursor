-- Remover o trigger problemático
DROP TRIGGER IF EXISTS audit_departments_changes_trigger ON public.departments;

-- Inserir apenas novos departamentos (evitando update)
INSERT INTO public.departments (name, description, color, integrates_org_chart) 
SELECT 'Recursos Humanos', 'Departamento de Recursos Humanos', '#10B981', true
WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE name = 'Recursos Humanos')
UNION ALL
SELECT 'Tecnologia da Informação', 'Departamento de TI e Sistemas', '#3B82F6', true
WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE name = 'Tecnologia da Informação')
UNION ALL
SELECT 'Financeiro', 'Departamento Financeiro e Contábil', '#F59E0B', true
WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE name = 'Financeiro')
UNION ALL
SELECT 'Comercial', 'Departamento Comercial e Vendas', '#EF4444', true
WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE name = 'Comercial')
UNION ALL
SELECT 'Operações', 'Departamento de Operações', '#8B5CF6', true
WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE name = 'Operações')
UNION ALL
SELECT 'Marketing', 'Departamento de Marketing', '#EC4899', true
WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE name = 'Marketing');

-- Recriar trigger melhorado que verifica se há usuário autenticado
CREATE OR REPLACE FUNCTION public.audit_departments_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Só fazer auditoria se houver usuário autenticado
  IF auth.uid() IS NOT NULL THEN
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
  END IF;

  RETURN NEW;
END;
$$;

-- Recriar o trigger
CREATE TRIGGER audit_departments_changes_trigger
  AFTER UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_departments_changes();