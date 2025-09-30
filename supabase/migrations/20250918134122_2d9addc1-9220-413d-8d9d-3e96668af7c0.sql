-- Criar a stored procedure process_email_approval
CREATE OR REPLACE FUNCTION public.process_email_approval(
  p_token_hash text,
  p_action text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_token approval_tokens%ROWTYPE;
  v_request_id uuid;
  v_approval_id uuid;
  v_result jsonb;
BEGIN
  -- Verificar se a ação é válida
  IF p_action NOT IN ('approve', 'reject') THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Invalid action'
    );
  END IF;

  -- Buscar o token válido e não usado
  SELECT * INTO v_token
  FROM approval_tokens 
  WHERE token_hash = p_token_hash
    AND expires_at > now()
    AND used_at IS NULL;

  -- Verificar se o token foi encontrado
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Invalid or expired token'
    );
  END IF;

  -- Marcar o token como usado
  UPDATE approval_tokens 
  SET used_at = now(), used_by = auth.uid()
  WHERE id = v_token.id;

  -- Processar baseado no tipo de token
  IF v_token.access_request_id IS NOT NULL THEN
    -- É uma solicitação de acesso
    v_request_id := v_token.access_request_id;
    
    IF p_action = 'approve' THEN
      -- Aprovar solicitação de acesso
      UPDATE access_requests 
      SET status = 'approved', 
          approved_at = now(),
          approved_by = auth.uid()
      WHERE id = v_request_id;
      
      v_result := jsonb_build_object(
        'success', true,
        'message', 'Solicitação de acesso aprovada com sucesso',
        'type', 'access_request'
      );
    ELSE
      -- Rejeitar solicitação de acesso
      UPDATE access_requests 
      SET status = 'rejected',
          rejected_at = now(),
          rejected_by = auth.uid()
      WHERE id = v_request_id;
      
      v_result := jsonb_build_object(
        'success', true,
        'message', 'Solicitação de acesso rejeitada',
        'type', 'access_request'
      );
    END IF;
    
  ELSIF v_token.approval_id IS NOT NULL THEN
    -- É uma aprovação de workflow
    v_approval_id := v_token.approval_id;
    
    IF p_action = 'approve' THEN
      -- Aprovar workflow
      UPDATE workflow_approvals 
      SET status = 'approved',
          approved_at = now(),
          approved_by = auth.uid()
      WHERE id = v_approval_id;
      
      v_result := jsonb_build_object(
        'success', true,
        'message', 'Aprovação de workflow confirmada',
        'type', 'workflow_approval'
      );
    ELSE
      -- Rejeitar workflow
      UPDATE workflow_approvals 
      SET status = 'rejected',
          rejected_at = now(),
          rejected_by = auth.uid()
      WHERE id = v_approval_id;
      
      v_result := jsonb_build_object(
        'success', true,
        'message', 'Aprovação de workflow rejeitada',
        'type', 'workflow_approval'
      );
    END IF;
  ELSE
    v_result := jsonb_build_object(
      'success', false,
      'error', 'Invalid token type'
    );
  END IF;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Internal server error: ' || SQLERRM
    );
END;
$$;