-- Corrigir problemas de aprovação de solicitações de acesso

-- 1. Remover versões duplicadas da função process_access_request_approval
-- Manter apenas a versão com parâmetros JSONB

-- Dropar todas as versões existentes da função
DROP FUNCTION IF EXISTS public.process_access_request_approval(uuid, boolean, text);
DROP FUNCTION IF EXISTS public.process_access_request_approval(uuid, boolean, text, uuid);
DROP FUNCTION IF EXISTS public.process_access_request_approval(uuid, boolean, text, uuid, text, text, uuid, text);
DROP FUNCTION IF EXISTS public.process_access_request_approval(uuid, boolean, text, uuid, text, text, uuid, jsonb);

-- Criar uma versão limpa e única da função
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
  
  IF approved THEN
    -- Gerar senha segura
    generated_password := public.generate_secure_password();
    
    -- Gerar UUID para o novo usuário
    new_user_id := gen_random_uuid();
    
    -- Usar dados editados se fornecidos, senão usar dados originais
    INSERT INTO public.profiles (
      id, name, email, role, department, department_id,
      notification_email, notification_app, notification_frequency,
      notification_types, status
    ) VALUES (
      new_user_id,
      request_record.name,
      request_record.email,
      COALESCE(edited_role, request_record.role),
      COALESCE(edited_department, request_record.department),
      COALESCE(edited_department_id, request_record.department_id),
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

-- 2. Criar foreign keys ausentes para corrigir os erros 400 nas consultas

-- Verificar se as tabelas existem antes de criar foreign keys
DO $$ 
BEGIN
  -- Criar foreign key para workflow_approvals se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'workflow_approvals_approver_id_fkey' 
    AND table_name = 'workflow_approvals'
  ) THEN
    ALTER TABLE public.workflow_approvals 
    ADD CONSTRAINT workflow_approvals_approver_id_fkey 
    FOREIGN KEY (approver_id) REFERENCES public.profiles(id);
  END IF;

  -- Criar foreign key para workflow_corrections se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'workflow_corrections_assigned_to_fkey' 
    AND table_name = 'workflow_corrections'
  ) THEN
    ALTER TABLE public.workflow_corrections 
    ADD CONSTRAINT workflow_corrections_assigned_to_fkey 
    FOREIGN KEY (assigned_to) REFERENCES public.profiles(id);
  END IF;
END $$;