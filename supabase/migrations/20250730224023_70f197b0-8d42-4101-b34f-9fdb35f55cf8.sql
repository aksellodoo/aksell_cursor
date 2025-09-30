-- Adicionar novo status auto_cancelled ao enum approval_status
ALTER TYPE approval_status ADD VALUE IF NOT EXISTS 'auto_cancelled';

-- Atualizar função process_unified_approval para suportar multi-aprovadores
CREATE OR REPLACE FUNCTION public.process_unified_approval(
  p_approval_id uuid,
  p_action approval_status,
  p_comments text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  approval_rec RECORD;
  step_complete BOOLEAN := false;
  all_approved BOOLEAN := false;
  result JSONB;
BEGIN
  -- Buscar aprovação e verificar se ainda está pendente
  SELECT * INTO approval_rec
  FROM public.workflow_approvals 
  WHERE id = p_approval_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Aprovação não encontrada ou já processada');
  END IF;
  
  -- Atualizar status da aprovação
  UPDATE public.workflow_approvals 
  SET 
    status = p_action,
    approved_at = CASE WHEN p_action = 'approved' THEN NOW() ELSE NULL END,
    approved_by = auth.uid(),
    comments = p_comments,
    updated_at = NOW()
  WHERE id = p_approval_id;
  
  -- Log da ação para auditoria
  INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
  VALUES (
    p_approval_id,
    'approval_action',
    'pending',
    p_action::text,
    auth.uid(),
    'workflow_approval'
  );
  
  -- Verificar se o step está completo baseado no formato de aprovação
  DECLARE
    approval_format text;
    total_approvals integer;
    approved_count integer;
    pending_count integer;
  BEGIN
    approval_format := approval_rec.approval_data->>'approval_format';
    
    IF approval_format IS NULL OR approval_format = 'single' THEN
      -- Formato single - sempre completo após primeira ação
      step_complete := true;
      all_approved := (p_action = 'approved');
      
    ELSIF approval_format = 'any' THEN
      -- Formato any - completo após primeira ação (outros serão cancelados automaticamente)
      step_complete := true;
      all_approved := (p_action = 'approved');
      
    ELSIF approval_format = 'all' THEN
      -- Formato all - precisa verificar se todos aprovaram
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'pending') as pending
      INTO total_approvals, approved_count, pending_count
      FROM public.workflow_approvals
      WHERE workflow_execution_id = approval_rec.workflow_execution_id
        AND step_id = approval_rec.step_id;
      
      -- Step completo se não há mais pendentes OU se foi rejeitado/precisa correção
      step_complete := (pending_count = 0) OR (p_action IN ('rejected', 'needs_correction'));
      all_approved := (pending_count = 0 AND approved_count = total_approvals);
      
    END IF;
  END;
  
  -- Se step foi rejeitado ou precisa correção, cancelar outras aprovações pendentes do mesmo step
  IF p_action IN ('rejected', 'needs_correction') THEN
    UPDATE public.workflow_approvals 
    SET 
      status = 'auto_cancelled',
      comments = 'Cancelado devido a rejeição ou solicitação de correção'
    WHERE workflow_execution_id = approval_rec.workflow_execution_id
      AND step_id = approval_rec.step_id
      AND status = 'pending'
      AND id != p_approval_id;
  END IF;
  
  -- Atualizar status da execução do workflow se necessário
  IF step_complete THEN
    IF all_approved THEN
      -- Marcar step como completo e continuar workflow
      UPDATE public.workflow_execution_steps
      SET 
        status = 'completed',
        completed_at = NOW(),
        output_data = jsonb_build_object('approval_result', 'approved')
      WHERE execution_id = approval_rec.workflow_execution_id
        AND node_id = approval_rec.step_id;
        
      -- TODO: Trigger workflow continuation (pode ser implementado com um job assíncrono)
      
    ELSE
      -- Marcar step como falhado se rejeitado
      IF p_action = 'rejected' THEN
        UPDATE public.workflow_execution_steps
        SET 
          status = 'failed',
          completed_at = NOW(),
          output_data = jsonb_build_object('approval_result', 'rejected', 'reason', p_comments),
          error_message = 'Aprovação rejeitada'
        WHERE execution_id = approval_rec.workflow_execution_id
          AND node_id = approval_rec.step_id;
          
        -- Marcar execução do workflow como falhada
        UPDATE public.workflow_executions
        SET 
          status = 'failed',
          completed_at = NOW(),
          error_message = 'Aprovação rejeitada'
        WHERE id = approval_rec.workflow_execution_id;
        
      ELSIF p_action = 'needs_correction' THEN
        -- Criar entrada de correção
        INSERT INTO public.workflow_corrections (
          workflow_execution_id,
          approval_id,
          assigned_to,
          requested_by,
          correction_details,
          status
        ) VALUES (
          approval_rec.workflow_execution_id,
          p_approval_id,
          approval_rec.approver_id,
          auth.uid(),
          p_comments,
          'pending'
        );
      END IF;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Aprovação processada com sucesso',
    'step_complete', step_complete,
    'all_approved', all_approved,
    'approval_format', approval_rec.approval_data->>'approval_format'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Erro ao processar aprovação: ' || SQLERRM
    );
END;
$$;