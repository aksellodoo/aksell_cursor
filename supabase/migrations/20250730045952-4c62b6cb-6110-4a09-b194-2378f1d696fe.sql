-- Fase 1: Reestruturação da Base de Dados para Sistema de Aprovações Unificado

-- Criar enum para tipos de aprovação
CREATE TYPE approval_type AS ENUM (
  'simple',
  'access_request', 
  'form_response',
  'document',
  'expense',
  'vacation',
  'purchase'
);

-- Expandir tabela workflow_approvals
ALTER TABLE workflow_approvals 
ADD COLUMN approval_type approval_type DEFAULT 'simple',
ADD COLUMN record_reference jsonb DEFAULT '{}',
ADD COLUMN original_data jsonb DEFAULT '{}',
ADD COLUMN auto_shared_record_id uuid,
ADD COLUMN requires_record_access boolean DEFAULT false;

-- Criar índices para performance
CREATE INDEX idx_workflow_approvals_type ON workflow_approvals (approval_type);
CREATE INDEX idx_workflow_approvals_approver_status ON workflow_approvals (approver_id, status);
CREATE INDEX idx_workflow_approvals_record_ref ON workflow_approvals USING gin (record_reference);

-- Função para auto-compartilhar registros quando aprovação é criada
CREATE OR REPLACE FUNCTION auto_share_approval_record()
RETURNS TRIGGER AS $$
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
      INSERT INTO record_shares (
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para revogar compartilhamento automático após aprovação/rejeição
CREATE OR REPLACE FUNCTION revoke_auto_share_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Se status mudou para approved, rejected ou needs_correction e existe compartilhamento automático
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected', 'needs_correction') 
     AND NEW.auto_shared_record_id IS NOT NULL THEN
    
    -- Revogar o compartilhamento automático
    UPDATE record_shares 
    SET status = 'revoked',
        updated_at = NOW()
    WHERE id = NEW.auto_shared_record_id;
    
    -- Criar notificação informando que acesso foi revogado
    INSERT INTO app_notifications (user_id, type, title, message, data)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar triggers
CREATE TRIGGER auto_share_approval_record_trigger
  BEFORE INSERT ON workflow_approvals
  FOR EACH ROW
  EXECUTE FUNCTION auto_share_approval_record();

CREATE TRIGGER revoke_auto_share_on_approval_trigger
  AFTER UPDATE ON workflow_approvals
  FOR EACH ROW
  EXECUTE FUNCTION revoke_auto_share_on_approval();

-- Migrar dados existentes para o novo formato
UPDATE workflow_approvals 
SET approval_type = 'simple'
WHERE approval_type IS NULL;

-- Função para criar aprovação com compartilhamento automático
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
) RETURNS uuid AS $$
DECLARE
  approval_id uuid;
BEGIN
  INSERT INTO workflow_approvals (
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
$$ LANGUAGE plpgsql SECURITY DEFINER;