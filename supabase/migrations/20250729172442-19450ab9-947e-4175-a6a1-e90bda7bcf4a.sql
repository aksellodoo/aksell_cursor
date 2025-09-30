-- Criar tabela para solicitações de acesso pendentes
CREATE TABLE public.pending_access_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  department TEXT NOT NULL,
  department_id UUID,
  notification_email BOOLEAN NOT NULL DEFAULT true,
  notification_app BOOLEAN NOT NULL DEFAULT true,
  notification_frequency TEXT NOT NULL DEFAULT 'instant',
  workflow_execution_id UUID,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  status TEXT NOT NULL DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE public.pending_access_requests ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins and directors can view all pending requests" 
ON public.pending_access_requests 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'director')
));

CREATE POLICY "System can create pending requests" 
ON public.pending_access_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins and directors can update pending requests" 
ON public.pending_access_requests 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'director')
));

CREATE POLICY "Admins and directors can delete pending requests" 
ON public.pending_access_requests 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'director')
));

-- Função para processar aprovação de solicitação
CREATE OR REPLACE FUNCTION public.process_access_request_approval(
  request_id UUID,
  approved BOOLEAN,
  rejection_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  request_record RECORD;
  new_user_id UUID;
  result JSON;
BEGIN
  -- Buscar a solicitação
  SELECT * INTO request_record 
  FROM public.pending_access_requests 
  WHERE id = request_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Solicitação não encontrada');
  END IF;
  
  IF approved THEN
    -- Criar o usuário aprovado
    INSERT INTO public.profiles (
      name, email, role, department, department_id,
      notification_email, notification_app, notification_frequency,
      status
    ) VALUES (
      request_record.name,
      request_record.email,
      request_record.role,
      request_record.department,
      request_record.department_id,
      request_record.notification_email,
      request_record.notification_app,
      request_record.notification_frequency,
      'active'
    ) RETURNING id INTO new_user_id;
    
    -- Criar usuário na auth (será feito pela edge function)
    result := json_build_object(
      'success', true, 
      'message', 'Usuário aprovado com sucesso',
      'user_id', new_user_id,
      'email', request_record.email,
      'password_hash', request_record.password_hash,
      'name', request_record.name
    );
  ELSE
    -- Salvar motivo da rejeição
    UPDATE public.pending_access_requests 
    SET rejection_reason = process_access_request_approval.rejection_reason,
        status = 'rejected'
    WHERE id = request_id;
    
    result := json_build_object(
      'success', true, 
      'message', 'Solicitação rejeitada'
    );
  END IF;
  
  -- Remover outras aprovações pendentes para esta solicitação
  UPDATE public.workflow_approvals 
  SET status = 'auto_rejected'
  WHERE workflow_execution_id = request_record.workflow_execution_id
    AND status = 'pending'
    AND approver_id != auth.uid();
  
  -- Remover notificações relacionadas
  DELETE FROM public.app_notifications
  WHERE data->>'access_request_id' = request_id::text;
  
  -- Remover a solicitação se aprovada ou rejeitada
  DELETE FROM public.pending_access_requests WHERE id = request_id;
  
  RETURN result;
END;
$$;

-- Função para limpeza automática de solicitações expiradas
CREATE OR REPLACE FUNCTION public.cleanup_expired_access_requests()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Remover solicitações expiradas
  DELETE FROM public.pending_access_requests 
  WHERE expires_at < now() AND status = 'pending';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Remover notificações órfãs
  DELETE FROM public.app_notifications
  WHERE type = 'access_request'
    AND NOT EXISTS (
      SELECT 1 FROM public.pending_access_requests 
      WHERE id::text = app_notifications.data->>'access_request_id'
    );
  
  RETURN deleted_count;
END;
$$;

-- Trigger para notificar sobre novas solicitações
CREATE OR REPLACE FUNCTION public.notify_access_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Notificar todos os admins e diretores
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
      'department', NEW.department
    )
  FROM public.profiles p
  WHERE p.role IN ('admin', 'director') 
    AND p.notification_app = true;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_new_access_request
  AFTER INSERT ON public.pending_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_access_request();