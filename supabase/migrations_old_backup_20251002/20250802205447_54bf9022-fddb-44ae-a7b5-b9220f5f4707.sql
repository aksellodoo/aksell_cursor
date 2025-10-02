-- 1. Remover o trigger problemático que causa o erro 409
DROP TRIGGER IF EXISTS trigger_create_access_request_approval ON pending_access_requests;

-- 2. Remover a função problemática que estava causando conflito
DROP FUNCTION IF EXISTS create_access_request_approval();

-- 3. Garantir que o trigger de notificação existe e está ativo
CREATE OR REPLACE FUNCTION public.notify_new_access_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Criar notificações para admins e diretores
  INSERT INTO public.app_notifications (user_id, type, title, message, data)
  SELECT 
    p.id,
    'access_request',
    'Nova solicitação de acesso',
    'Usuário ' || NEW.name || ' solicitou acesso ao sistema',
    jsonb_build_object(
      'access_request_id', NEW.id,
      'requester_name', NEW.name,
      'requester_email', NEW.email,
      'department', NEW.department,
      'role', NEW.role
    )
  FROM public.profiles p
  WHERE p.role IN ('admin', 'director') 
    AND p.status = 'active'
    AND p.notification_app = true;
  
  RETURN NEW;
END;
$function$;

-- 4. Criar o trigger AFTER INSERT para notificações (não causa conflito)
DROP TRIGGER IF EXISTS trigger_notify_new_access_request ON pending_access_requests;
CREATE TRIGGER trigger_notify_new_access_request
  AFTER INSERT ON pending_access_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_access_request();

-- 5. Melhorar a função de aprovação para garantir limpeza correta das notificações
CREATE OR REPLACE FUNCTION public.process_access_request_approval(
  request_id uuid, 
  approved boolean, 
  rejection_reason text DEFAULT NULL::text, 
  supervisor_id uuid DEFAULT NULL::uuid,
  edited_role text DEFAULT NULL::text,
  edited_department text DEFAULT NULL::text,
  edited_department_id uuid DEFAULT NULL::uuid,
  edited_notification_types jsonb DEFAULT NULL::jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  request_record RECORD;
  new_user_id UUID;
  generated_password TEXT;
  result JSON;
BEGIN
  -- Buscar a solicitação
  SELECT * INTO request_record 
  FROM public.pending_access_requests 
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Solicitação não encontrada ou já processada');
  END IF;
  
  -- Remover TODAS as notificações para TODOS os aprovadores PRIMEIRO
  DELETE FROM public.app_notifications
  WHERE type = 'access_request'
    AND (data->>'access_request_id')::uuid = request_id;
  
  IF approved THEN
    -- Gerar senha segura
    generated_password := public.generate_secure_password();
    
    -- Gerar UUID para o novo usuário
    new_user_id := gen_random_uuid();
    
    -- Usar dados editados se fornecidos, senão usar originais
    INSERT INTO public.profiles (
      id, name, email, 
      role, 
      department, 
      department_id,
      supervisor_id,
      notification_email, 
      notification_app, 
      notification_frequency,
      notification_types,
      status
    ) VALUES (
      new_user_id,
      request_record.name,
      request_record.email,
      COALESCE(edited_role, request_record.role),
      COALESCE(edited_department, request_record.department),
      COALESCE(edited_department_id, request_record.department_id),
      supervisor_id,
      request_record.notification_email,
      request_record.notification_app,
      request_record.notification_frequency,
      COALESCE(edited_notification_types, '{"changes": true, "chatter": true, "mentions": true, "assignments": true}'::jsonb),
      'pending_auth_creation'
    );
    
    -- Marcar solicitação como aprovada
    UPDATE public.pending_access_requests 
    SET status = 'approved'
    WHERE id = request_id;
    
    result := json_build_object(
      'success', true, 
      'message', 'Usuário aprovado com sucesso',
      'user_id', new_user_id,
      'email', request_record.email,
      'password', generated_password,
      'name', request_record.name
    );
  ELSE
    -- Marcar solicitação como rejeitada (SILENCIOSO - sem email)
    UPDATE public.pending_access_requests 
    SET 
      status = 'rejected',
      rejection_reason = process_access_request_approval.rejection_reason
    WHERE id = request_id;
    
    -- Log para auditoria (sem notificar o solicitante)
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (
      request_id,
      'access_request_rejected',
      'pending',
      'rejected: ' || COALESCE(process_access_request_approval.rejection_reason, 'No reason provided'),
      auth.uid(),
      'access_request'
    );
    
    result := json_build_object(
      'success', true, 
      'message', 'Solicitação rejeitada'
    );
  END IF;
  
  RETURN result;
END;
$function$;