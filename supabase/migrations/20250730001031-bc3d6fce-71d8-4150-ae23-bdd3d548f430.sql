-- Atualizar função process_access_request_approval para incluir supervisor_id
CREATE OR REPLACE FUNCTION public.process_access_request_approval(
    request_id uuid, 
    approved boolean, 
    rejection_reason text DEFAULT NULL::text,
    supervisor_id uuid DEFAULT NULL::uuid
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
  
  IF approved THEN
    -- Gerar senha segura
    generated_password := public.generate_secure_password();
    
    -- Gerar UUID para o novo usuário
    new_user_id := gen_random_uuid();
    
    -- Criar perfil do usuário aprovado na tabela profiles
    INSERT INTO public.profiles (
      id, name, email, role, department, department_id,
      supervisor_id,
      notification_email, notification_app, notification_frequency,
      status
    ) VALUES (
      new_user_id,
      request_record.name,
      request_record.email,
      request_record.role,
      request_record.department,
      request_record.department_id,
      supervisor_id,
      request_record.notification_email,
      request_record.notification_app,
      request_record.notification_frequency,
      'pending_auth_creation'
    );
    
    -- Atualizar a solicitação com o supervisor escolhido
    UPDATE public.pending_access_requests 
    SET status = 'approved', supervisor_id = supervisor_id
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