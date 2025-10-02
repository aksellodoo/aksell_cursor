-- Corrigir warnings de segurança das funções criadas

-- Recriar função para auto-compartilhar registros com search_path seguro
CREATE OR REPLACE FUNCTION auto_share_approval_record()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
DECLARE
  share_id uuid;
BEGIN
  -- Se a aprovação requer acesso ao registro e tem referência
  IF NEW.requires_record_access = true AND NEW.record_reference IS NOT NULL THEN
    -- Extrair dados da referência
    DECLARE
      record_type text;
      record_id uuid;
      record_name text;
    BEGIN
      record_type := NEW.record_reference->>'record_type';
      record_id := (NEW.record_reference->>'record_id')::uuid;
      record_name := COALESCE(NEW.record_reference->>'record_name', 'Registro para aprovação');
      
      -- Criar compartilhamento automático
      INSERT INTO public.record_shares (
        shared_by, 
        shared_with, 
        record_type, 
        record_id, 
        record_name,
        permissions,
        status,
        expires_at
      ) VALUES (
        -- Sistema compartilha (pode usar um UUID específico do sistema)
        '00000000-0000-0000-0000-000000000000',
        NEW.approver_id,
        record_type,
        record_id,
        record_name,
        ARRAY['view', 'comment'],
        'active',
        CASE 
          WHEN NEW.expires_at IS NOT NULL THEN NEW.expires_at + INTERVAL '1 day'
          ELSE NOW() + INTERVAL '30 days'
        END
      ) RETURNING id INTO share_id;
      
      -- Atualizar aprovação com ID do compartilhamento
      NEW.auto_shared_record_id := share_id;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recriar função para revogar compartilhamento com search_path seguro
CREATE OR REPLACE FUNCTION revoke_auto_share_on_approval()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  -- Se status mudou para approved, rejected ou needs_correction e existe compartilhamento automático
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected', 'needs_correction') 
     AND NEW.auto_shared_record_id IS NOT NULL THEN
    
    -- Revogar o compartilhamento automático
    UPDATE public.record_shares 
    SET status = 'revoked',
        updated_at = NOW()
    WHERE id = NEW.auto_shared_record_id;
    
    -- Criar notificação informando que acesso foi revogado
    INSERT INTO public.app_notifications (user_id, type, title, message, data)
    VALUES (
      NEW.approver_id,
      'share_revoked',
      'Acesso ao registro revogado',
      'Seu acesso temporário ao registro foi revogado após a aprovação.',
      jsonb_build_object(
        'approval_id', NEW.id,
        'record_reference', NEW.record_reference,
        'approval_status', NEW.status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recriar função para criar aprovação com search_path seguro
CREATE OR REPLACE FUNCTION create_approval_with_record_access(
  p_workflow_execution_id uuid,
  p_step_id text,
  p_approver_id uuid,
  p_approval_data jsonb DEFAULT '{}',
  p_expires_at timestamp with time zone DEFAULT NULL,
  p_priority text DEFAULT 'medium',
  p_approval_type approval_type DEFAULT 'simple',
  p_record_reference jsonb DEFAULT '{}',
  p_requires_record_access boolean DEFAULT false
) RETURNS uuid 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
DECLARE
  approval_id uuid;
BEGIN
  INSERT INTO public.workflow_approvals (
    workflow_execution_id,
    step_id,
    approver_id,
    approval_data,
    expires_at,
    priority,
    approval_type,
    record_reference,
    requires_record_access
  ) VALUES (
    p_workflow_execution_id,
    p_step_id,
    p_approver_id,
    p_approval_data,
    p_expires_at,
    p_priority,
    p_approval_type,
    p_record_reference,
    p_requires_record_access
  ) RETURNING id INTO approval_id;
  
  RETURN approval_id;
END;
$$;