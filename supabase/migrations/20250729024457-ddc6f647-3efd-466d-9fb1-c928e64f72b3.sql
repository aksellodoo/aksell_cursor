-- Criar triggers para eventos do sistema

-- Trigger para mudanças de departamento em usuários
CREATE OR REPLACE FUNCTION public.trigger_user_department_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.department_id IS DISTINCT FROM NEW.department_id THEN
    PERFORM public.process_workflow_triggers(
      'system_event',
      jsonb_build_object(
        'event_type', 'user_department_changed',
        'user_id', NEW.id,
        'old_department_id', OLD.department_id,
        'new_department_id', NEW.department_id,
        'changed_at', now()
      )
    );
  END IF;
  
  -- Trigger para mudanças de role
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    PERFORM public.process_workflow_triggers(
      'system_event',
      jsonb_build_object(
        'event_type', 'user_role_changed',
        'user_id', NEW.id,
        'old_role', OLD.role,
        'new_role', NEW.role,
        'changed_at', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger para mudanças em profiles
DROP TRIGGER IF EXISTS trigger_workflow_profile_changes ON public.profiles;
CREATE TRIGGER trigger_workflow_profile_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_user_department_change();

-- Trigger para upload de arquivos
CREATE OR REPLACE FUNCTION public.trigger_file_uploaded()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.process_workflow_triggers(
    'system_event',
    jsonb_build_object(
      'event_type', 'file_uploaded',
      'file_id', NEW.id,
      'uploaded_by', NEW.uploaded_by,
      'record_type', NEW.record_type,
      'record_id', NEW.record_id,
      'uploaded_at', now()
    )
  );
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger para upload de arquivos
DROP TRIGGER IF EXISTS trigger_workflow_file_upload ON public.chatter_files;
CREATE TRIGGER trigger_workflow_file_upload
  AFTER INSERT ON public.chatter_files
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_file_uploaded();

-- Trigger para documentos vencidos (será chamado pela função de verificação de vencimento)
CREATE OR REPLACE FUNCTION public.trigger_document_expired(document_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.process_workflow_triggers(
    'system_event',
    jsonb_build_object(
      'event_type', 'document_expired',
      'document_id', document_id,
      'expired_at', now()
    )
  );
END;
$$;

-- Trigger para login de usuário (será chamado quando last_login for atualizado)
CREATE OR REPLACE FUNCTION public.trigger_user_login()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Apenas disparar se last_login foi realmente atualizado (não era igual antes)
  IF OLD.last_login IS DISTINCT FROM NEW.last_login AND NEW.last_login IS NOT NULL THEN
    PERFORM public.process_workflow_triggers(
      'system_event',
      jsonb_build_object(
        'event_type', 'user_login',
        'user_id', NEW.id,
        'login_at', NEW.last_login
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger para login
DROP TRIGGER IF EXISTS trigger_workflow_user_login ON public.profiles;
CREATE TRIGGER trigger_workflow_user_login
  AFTER UPDATE OF last_login ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_user_login();

-- Trigger para edição de tarefas
CREATE OR REPLACE FUNCTION public.trigger_task_edited()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Apenas disparar se não for mudança de status (já coberto por outro trigger)
  IF (OLD.title IS DISTINCT FROM NEW.title OR
      OLD.description IS DISTINCT FROM NEW.description OR
      OLD.priority IS DISTINCT FROM NEW.priority OR
      OLD.due_date IS DISTINCT FROM NEW.due_date OR
      OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
    
    PERFORM public.process_workflow_triggers(
      'system_event',
      jsonb_build_object(
        'event_type', 'task_edited',
        'task_id', NEW.id,
        'edited_by', auth.uid(),
        'edited_at', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger para edição de tarefas
DROP TRIGGER IF EXISTS trigger_workflow_task_edited ON public.tasks;
CREATE TRIGGER trigger_workflow_task_edited
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_task_edited();

-- Função para processar field_change triggers com dados específicos
CREATE OR REPLACE FUNCTION public.trigger_field_change(
  p_table_name TEXT,
  p_record_id UUID,
  p_field_name TEXT,
  p_old_value TEXT,
  p_new_value TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Buscar workflows que monitoram este campo específico
  PERFORM public.process_workflow_triggers(
    'field_change',
    jsonb_build_object(
      'table_name', p_table_name,
      'record_id', p_record_id,
      'field_name', p_field_name,
      'old_value', p_old_value,
      'new_value', p_new_value,
      'changed_at', now(),
      'changed_by', auth.uid()
    )
  );
END;
$$;

-- Atualizar a função de verificação de vencimento para incluir triggers
CREATE OR REPLACE FUNCTION public.check_document_expiry_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  file_record RECORD;
  notification_date timestamp with time zone;
  user_id uuid;
BEGIN
  -- Buscar arquivos que precisam de notificação
  FOR file_record IN 
    SELECT cf.*, p.name as uploader_name
    FROM public.chatter_files cf
    LEFT JOIN public.profiles p ON p.id = cf.uploaded_by
    WHERE cf.expiry_date IS NOT NULL 
      AND cf.notify_before_expiry IS NOT NULL
      AND cf.approval_status = 'approved'
      AND cf.is_current_version = true
  LOOP
    notification_date := file_record.expiry_date - file_record.notify_before_expiry;
    
    -- Se chegou a hora de notificar
    IF now() >= notification_date AND now() < file_record.expiry_date THEN
      -- Notificar usuários específicos
      IF file_record.notify_users IS NOT NULL THEN
        FOREACH user_id IN ARRAY file_record.notify_users
        LOOP
          INSERT INTO public.app_notifications (user_id, type, title, message, data)
          VALUES (
            user_id,
            'document_expiry',
            'Documento próximo do vencimento',
            'O documento "' || file_record.description || '" vence em breve.',
            jsonb_build_object(
              'file_id', file_record.id,
              'description', file_record.description,
              'expiry_date', file_record.expiry_date,
              'record_type', file_record.record_type,
              'record_id', file_record.record_id
            )
          );
        END LOOP;
      END IF;
      
      -- Notificar departamento
      IF file_record.notify_department_id IS NOT NULL THEN
        INSERT INTO public.app_notifications (user_id, type, title, message, data)
        SELECT 
          p.id,
          'document_expiry',
          'Documento próximo do vencimento',
          'O documento "' || file_record.description || '" vence em breve.',
          jsonb_build_object(
            'file_id', file_record.id,
            'description', file_record.description,
            'expiry_date', file_record.expiry_date,
            'record_type', file_record.record_type,
            'record_id', file_record.record_id
          )
        FROM public.profiles p
        WHERE p.department_id = file_record.notify_department_id;
      END IF;
    END IF;
    
    -- Se o documento já venceu, disparar trigger de documento vencido
    IF now() >= file_record.expiry_date THEN
      PERFORM public.trigger_document_expired(file_record.id);
    END IF;
  END LOOP;
END;
$$;