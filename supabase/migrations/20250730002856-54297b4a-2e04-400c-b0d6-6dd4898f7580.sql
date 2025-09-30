-- Update the process_access_request_approval function to handle edited data
CREATE OR REPLACE FUNCTION public.process_access_request_approval(
  request_id uuid, 
  approved boolean, 
  rejection_reason text DEFAULT NULL::text, 
  supervisor_id uuid DEFAULT NULL::uuid,
  edited_role text DEFAULT NULL::text,
  edited_department text DEFAULT NULL::text,
  edited_department_id uuid DEFAULT NULL::text,
  edited_notification_types text DEFAULT NULL::text
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
  final_notification_types JSONB;
BEGIN
  -- Buscar a solicitação
  SELECT * INTO request_record 
  FROM public.pending_access_requests 
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Solicitação não encontrada ou já processada');
  END IF;
  
  IF approved THEN
    -- Gerar senha segura
    generated_password := public.generate_secure_password();
    
    -- Gerar UUID para o novo usuário
    new_user_id := gen_random_uuid();
    
    -- Preparar notification_types: se foi editado, usar os novos valores, senão usar os padrões
    IF edited_notification_types IS NOT NULL THEN
      final_notification_types := edited_notification_types::jsonb;
    ELSE
      -- Criar notification_types padrão baseado nas preferências básicas
      final_notification_types := jsonb_build_object(
        'changes', jsonb_build_object('app', request_record.notification_app, 'email', request_record.notification_email),
        'chatter', jsonb_build_object('app', request_record.notification_app, 'email', request_record.notification_email),
        'mentions', jsonb_build_object('app', request_record.notification_app, 'email', request_record.notification_email),
        'assignments', jsonb_build_object('app', request_record.notification_app, 'email', request_record.notification_email),
        'approvals', jsonb_build_object('app', request_record.notification_app, 'email', request_record.notification_email),
        'corrections', jsonb_build_object('app', request_record.notification_app, 'email', request_record.notification_email),
        'tasks', jsonb_build_object('app', request_record.notification_app, 'email', request_record.notification_email),
        'access_requests', jsonb_build_object('app', request_record.notification_app, 'email', request_record.notification_email)
      );
    END IF;
    
    -- Criar perfil do usuário aprovado na tabela profiles com dados editados (se fornecidos)
    INSERT INTO public.profiles (
      id, name, email, role, department, department_id,
      supervisor_id,
      notification_email, notification_app, notification_frequency,
      notification_types,
      status
    ) VALUES (
      new_user_id,
      request_record.name,
      request_record.email,
      COALESCE(edited_role, request_record.role),
      COALESCE(edited_department, request_record.department),
      COALESCE(edited_department_id::uuid, request_record.department_id),
      supervisor_id,
      request_record.notification_email,
      request_record.notification_app,
      request_record.notification_frequency,
      final_notification_types,
      'pending_auth_creation'
    );
    
    -- Atualizar a solicitação com o supervisor escolhido
    UPDATE public.pending_access_requests 
    SET status = 'approved', supervisor_id = supervisor_id
    WHERE id = request_id;
    
    -- Log das alterações feitas durante aprovação
    IF edited_role IS NOT NULL AND edited_role != request_record.role THEN
      INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
      VALUES (new_user_id, 'role_edited_during_approval', request_record.role, edited_role, auth.uid(), 'user');
    END IF;
    
    IF edited_department IS NOT NULL AND edited_department != request_record.department THEN
      INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
      VALUES (new_user_id, 'department_edited_during_approval', request_record.department, edited_department, auth.uid(), 'user');
    END IF;
    
    IF edited_notification_types IS NOT NULL THEN
      INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
      VALUES (new_user_id, 'notification_types_configured_during_approval', 'default', 'custom', auth.uid(), 'user');
    END IF;
    
    result := json_build_object(
      'success', true, 
      'message', 'Usuário aprovado com sucesso',
      'user_id', new_user_id,
      'email', request_record.email,
      'password', generated_password,
      'name', request_record.name
    );
  ELSE
    -- Marcar solicitação como rejeitada
    UPDATE public.pending_access_requests 
    SET 
      status = 'rejected',
      rejection_reason = process_access_request_approval.rejection_reason
    WHERE id = request_id;
    
    result := json_build_object(
      'success', true, 
      'message', 'Solicitação rejeitada'
    );
  END IF;
  
  -- Remover outras aprovações pendentes para esta solicitação se houver workflow
  IF request_record.workflow_execution_id IS NOT NULL THEN
    UPDATE public.workflow_approvals 
    SET status = 'auto_rejected'
    WHERE workflow_execution_id = request_record.workflow_execution_id
      AND status = 'pending'
      AND approver_id != auth.uid();
  END IF;
  
  -- Remover notificações relacionadas
  DELETE FROM public.app_notifications
  WHERE data->>'access_request_id' = request_id::text;
  
  RETURN result;
END;
$function$;