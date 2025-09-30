-- Etapa 1: Adicionar colunas para atribuição flexível na tabela tasks
ALTER TABLE public.tasks 
ADD COLUMN assigned_department UUID REFERENCES public.departments(id),
ADD COLUMN assigned_users UUID[];

-- Criar constraint para garantir que pelo menos um tipo de atribuição seja feito
ALTER TABLE public.tasks
ADD CONSTRAINT valid_flexible_assignment CHECK (
  (assigned_to IS NOT NULL) OR 
  (assigned_department IS NOT NULL) OR 
  (assigned_users IS NOT NULL AND array_length(assigned_users, 1) > 0)
);

-- Atualizar trigger de auditoria para incluir novos campos
CREATE OR REPLACE FUNCTION public.audit_task_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Track status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.task_history (task_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'status', OLD.status, NEW.status, auth.uid());
  END IF;

  -- Track assigned_to changes
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO public.task_history (task_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'assigned_to', 
      (SELECT name FROM public.profiles WHERE id = OLD.assigned_to),
      (SELECT name FROM public.profiles WHERE id = NEW.assigned_to),
      auth.uid());
  END IF;

  -- Track assigned_department changes
  IF OLD.assigned_department IS DISTINCT FROM NEW.assigned_department THEN
    INSERT INTO public.task_history (task_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'assigned_department', 
      (SELECT name FROM public.departments WHERE id = OLD.assigned_department),
      (SELECT name FROM public.departments WHERE id = NEW.assigned_department),
      auth.uid());
  END IF;

  -- Track assigned_users changes
  IF OLD.assigned_users IS DISTINCT FROM NEW.assigned_users THEN
    INSERT INTO public.task_history (task_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'assigned_users', 
      OLD.assigned_users::TEXT,
      NEW.assigned_users::TEXT,
      auth.uid());
  END IF;

  -- Track priority changes
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO public.task_history (task_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'priority', OLD.priority, NEW.priority, auth.uid());
  END IF;

  -- Track due_date changes
  IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
    INSERT INTO public.task_history (task_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'due_date', OLD.due_date::TEXT, NEW.due_date::TEXT, auth.uid());
  END IF;

  -- Mark as completed when status changes to done
  IF OLD.status != 'done' AND NEW.status = 'done' AND NEW.completed_at IS NULL THEN
    NEW.completed_at = now();
  END IF;

  -- Clear completed_at when status changes from done to something else
  IF OLD.status = 'done' AND NEW.status != 'done' THEN
    NEW.completed_at = NULL;
  END IF;

  RETURN NEW;
END;
$$;