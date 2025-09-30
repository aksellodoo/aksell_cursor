-- Corrigir problema de segurança: search_path nas funções
-- Atualizar a função audit_task_changes para ser security definer com search_path

CREATE OR REPLACE FUNCTION public.audit_task_changes()
RETURNS TRIGGER 
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