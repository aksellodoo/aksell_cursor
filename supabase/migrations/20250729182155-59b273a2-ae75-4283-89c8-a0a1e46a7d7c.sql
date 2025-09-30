-- 1. Ajustar RLS para permitir inserções anônimas na tabela pending_access_requests
DROP POLICY IF EXISTS "Anyone can create pending requests" ON public.pending_access_requests;

CREATE POLICY "Public can create pending requests" 
ON public.pending_access_requests 
FOR INSERT 
WITH CHECK (true);

-- 2. Função para gerar senhas seguras
CREATE OR REPLACE FUNCTION public.generate_secure_password()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- 3. Melhorar função de processamento de aprovação
CREATE OR REPLACE FUNCTION public.process_access_request_approval(request_id uuid, approved boolean, rejection_reason text DEFAULT NULL::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
      notification_email, notification_app, notification_frequency,
      status
    ) VALUES (
      new_user_id,
      request_record.name,
      request_record.email,
      request_record.role,
      request_record.department,
      request_record.department_id,
      request_record.notification_email,
      request_record.notification_app,
      request_record.notification_frequency,
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
$$;

-- 4. Atualizar função de limpeza automática
CREATE OR REPLACE FUNCTION public.cleanup_expired_access_requests()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count INTEGER;
  rejected_count INTEGER;
BEGIN
  -- Remover solicitações pendentes expiradas
  DELETE FROM public.pending_access_requests 
  WHERE expires_at < now() AND status = 'pending';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Remover solicitações rejeitadas antigas (mais de 30 dias)
  DELETE FROM public.pending_access_requests 
  WHERE status = 'rejected' 
    AND created_at < now() - INTERVAL '30 days';
  
  GET DIAGNOSTICS rejected_count = ROW_COUNT;
  
  -- Remover notificações órfãs
  DELETE FROM public.app_notifications
  WHERE type = 'access_request'
    AND NOT EXISTS (
      SELECT 1 FROM public.pending_access_requests 
      WHERE id::text = app_notifications.data->>'access_request_id'
    );
  
  -- Log da limpeza
  INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
  VALUES (
    gen_random_uuid(),
    'cleanup_expired_requests',
    (deleted_count + rejected_count)::text,
    'automatic_cleanup',
    '00000000-0000-0000-0000-000000000000',
    'system'
  );
  
  RETURN deleted_count + rejected_count;
END;
$$;