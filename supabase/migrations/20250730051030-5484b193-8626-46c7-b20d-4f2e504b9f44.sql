-- Fase 3: Integração de Solicitações de Acesso ao Sistema Unificado de Aprovações

-- 1. Criar trigger para gerar automaticamente aprovações para solicitações de acesso
CREATE OR REPLACE FUNCTION public.create_access_request_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  approval_id uuid;
BEGIN
  -- Apenas criar aprovação para solicitações pendentes
  IF NEW.status = 'pending' AND (OLD IS NULL OR OLD.status != 'pending') THEN
    -- Criar aprovação unificada
    INSERT INTO public.workflow_approvals (
      workflow_execution_id,
      step_id,
      approver_id,
      approval_data,
      priority,
      approval_type,
      record_reference,
      original_data,
      requires_record_access
    ) VALUES (
      -- Usar ID da solicitação como execution ID temporário
      NEW.id,
      'access_request_approval',
      -- Buscar primeiro admin/director disponível como aprovador padrão
      (SELECT id FROM public.profiles WHERE role IN ('admin', 'director') AND status = 'active' LIMIT 1),
      jsonb_build_object(
        'request_id', NEW.id,
        'requester_name', NEW.name,
        'requester_email', NEW.email
      ),
      'medium',
      'access_request'::approval_type,
      jsonb_build_object(
        'record_type', 'access_request',
        'record_id', NEW.id,
        'record_name', 'Solicitação de acesso de ' || NEW.name
      ),
      jsonb_build_object(
        'name', NEW.name,
        'email', NEW.email,
        'role', NEW.role,
        'department', NEW.department,
        'department_id', NEW.department_id,
        'notification_email', NEW.notification_email,
        'notification_app', NEW.notification_app,
        'notification_frequency', NEW.notification_frequency,
        'created_at', NEW.created_at
      ),
      false -- Solicitações de acesso não precisam de acesso temporário a registros
    ) RETURNING id INTO approval_id;
    
    -- Atualizar solicitação com o ID da aprovação gerada
    NEW.workflow_execution_id := approval_id;
    
    -- Log da criação automática
    INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
    VALUES (
      NEW.id,
      'auto_approval_created',
      'null',
      approval_id::text,
      '00000000-0000-0000-0000-000000000000',
      'access_request'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar o trigger
DROP TRIGGER IF EXISTS trigger_create_access_request_approval ON public.pending_access_requests;
CREATE TRIGGER trigger_create_access_request_approval
  BEFORE INSERT OR UPDATE ON public.pending_access_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.create_access_request_approval();

-- 2. Modificar notificações para evitar duplicação
-- Desabilitar notificação automática de solicitações de acesso (será feita via aprovações)
DROP TRIGGER IF EXISTS trigger_notify_access_request ON public.pending_access_requests;

-- 3. Atualizar função de processamento de aprovação unificada para suportar solicitações de acesso
CREATE OR REPLACE FUNCTION public.process_unified_approval(
  p_approval_id uuid,
  p_action text,
  p_comments text DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  approval_record RECORD;
  access_request_record RECORD;
  result JSON;
BEGIN
  -- Buscar a aprovação
  SELECT * INTO approval_record
  FROM public.workflow_approvals
  WHERE id = p_approval_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Aprovação não encontrada ou já processada');
  END IF;
  
  -- Atualizar status da aprovação
  UPDATE public.workflow_approvals
  SET 
    status = CASE 
      WHEN p_action = 'approved' THEN 'approved'::approval_status
      WHEN p_action = 'rejected' THEN 'rejected'::approval_status
      WHEN p_action = 'needs_correction' THEN 'needs_correction'::approval_status
      ELSE status
    END,
    approved_at = CASE WHEN p_action IN ('approved', 'rejected', 'needs_correction') THEN now() ELSE approved_at END,
    approved_by = CASE WHEN p_action IN ('approved', 'rejected', 'needs_correction') THEN auth.uid() ELSE approved_by END,
    comments = p_comments
  WHERE id = p_approval_id;
  
  -- Se for aprovação de solicitação de acesso, processar usando a função existente
  IF approval_record.approval_type = 'access_request' THEN
    -- Buscar dados da solicitação de acesso
    SELECT * INTO access_request_record
    FROM public.pending_access_requests
    WHERE id = (approval_record.original_data->>'request_id')::uuid;
    
    IF FOUND THEN
      -- Usar função existente de processamento de solicitação de acesso
      SELECT public.process_access_request_approval(
        access_request_record.id,
        p_action = 'approved',
        CASE WHEN p_action = 'rejected' THEN p_comments ELSE NULL END
      ) INTO result;
    ELSE
      RETURN json_build_object('success', false, 'message', 'Solicitação de acesso não encontrada');
    END IF;
  ELSE
    -- Para outros tipos de aprovação, retornar sucesso simples
    result := json_build_object(
      'success', true, 
      'message', CASE 
        WHEN p_action = 'approved' THEN 'Aprovação realizada com sucesso'
        WHEN p_action = 'rejected' THEN 'Rejeição realizada com sucesso'
        WHEN p_action = 'needs_correction' THEN 'Correção solicitada com sucesso'
        ELSE 'Ação processada com sucesso'
      END
    );
  END IF;
  
  -- Log da ação
  INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
  VALUES (
    p_approval_id,
    'unified_approval_processed',
    approval_record.status::text,
    p_action,
    auth.uid(),
    'unified_approval'
  );
  
  RETURN result;
END;
$$;

-- 4. Migrar solicitações pendentes existentes para o sistema unificado
DO $$
DECLARE
  pending_request RECORD;
  approval_id uuid;
BEGIN
  -- Buscar solicitações pendentes que ainda não têm aprovação unificada
  FOR pending_request IN 
    SELECT * FROM public.pending_access_requests 
    WHERE status = 'pending' 
      AND workflow_execution_id IS NULL
  LOOP
    -- Criar aprovação unificada para cada solicitação pendente
    INSERT INTO public.workflow_approvals (
      workflow_execution_id,
      step_id,
      approver_id,
      approval_data,
      priority,
      approval_type,
      record_reference,
      original_data,
      requires_record_access
    ) VALUES (
      pending_request.id,
      'access_request_approval',
      (SELECT id FROM public.profiles WHERE role IN ('admin', 'director') AND status = 'active' LIMIT 1),
      jsonb_build_object(
        'request_id', pending_request.id,
        'requester_name', pending_request.name,
        'requester_email', pending_request.email
      ),
      'medium',
      'access_request'::approval_type,
      jsonb_build_object(
        'record_type', 'access_request',
        'record_id', pending_request.id,
        'record_name', 'Solicitação de acesso de ' || pending_request.name
      ),
      jsonb_build_object(
        'name', pending_request.name,
        'email', pending_request.email,
        'role', pending_request.role,
        'department', pending_request.department,
        'department_id', pending_request.department_id,
        'notification_email', pending_request.notification_email,
        'notification_app', pending_request.notification_app,
        'notification_frequency', pending_request.notification_frequency,
        'created_at', pending_request.created_at
      ),
      false
    ) RETURNING id INTO approval_id;
    
    -- Atualizar solicitação com o ID da aprovação
    UPDATE public.pending_access_requests 
    SET workflow_execution_id = approval_id
    WHERE id = pending_request.id;
  END LOOP;
END;
$$;