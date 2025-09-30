-- Corrigir search_path das funções criadas
CREATE OR REPLACE FUNCTION public.update_record_shares_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_record_shares()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.field_audit_log (
      record_id, field_name, old_value, new_value, 
      changed_by, record_type
    )
    VALUES (
      NEW.id, 'record_shared', NULL, 
      NEW.record_type || ':' || NEW.record_id || ' shared with ' || (
        SELECT name FROM public.profiles WHERE id = NEW.shared_with
      ),
      NEW.shared_by, 'record_share'
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.field_audit_log (
        record_id, field_name, old_value, new_value, 
        changed_by, record_type
      )
      VALUES (
        NEW.id, 'status', OLD.status, NEW.status,
        auth.uid(), 'record_share'
      );
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.field_audit_log (
      record_id, field_name, old_value, new_value, 
      changed_by, record_type
    )
    VALUES (
      OLD.id, 'record_share_revoked', OLD.status, 'deleted',
      auth.uid(), 'record_share'
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;