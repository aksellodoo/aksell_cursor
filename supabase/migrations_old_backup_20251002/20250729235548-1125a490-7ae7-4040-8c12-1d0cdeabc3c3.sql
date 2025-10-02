-- Corrigir warnings de segurança fixando search_path nas funções

-- Recriar função generate_approval_token com search_path fixo
CREATE OR REPLACE FUNCTION public.generate_approval_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  token TEXT;
BEGIN
  -- Gerar token aleatório
  token := encode(gen_random_bytes(32), 'base64url');
  
  -- Retornar o token (será usado para gerar o hash no edge function)
  RETURN token;
END;
$$;

-- Recriar função process_email_approval com search_path fixo
CREATE OR REPLACE FUNCTION public.process_email_approval(
  p_token_hash TEXT,
  p_action TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  token_record RECORD;
  approval_record RECORD;
  access_request_record RECORD;
  result JSON;
BEGIN
  -- Buscar token válido
  SELECT * INTO token_record
  FROM public.approval_tokens
  WHERE token_hash = p_token_hash
    AND expires_at > now()
    AND used_at IS NULL
    AND action = p_action;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Token inválido ou expirado');
  END IF;
  
  -- Marcar token como usado
  UPDATE public.approval_tokens 
  SET used_at = now(), used_by = p_user_id
  WHERE id = token_record.id;
  
  -- Processar aprovação de workflow
  IF token_record.approval_id IS NOT NULL THEN
    SELECT * INTO approval_record
    FROM public.workflow_approvals
    WHERE id = token_record.approval_id;
    
    IF FOUND THEN
      -- Atualizar aprovação
      UPDATE public.workflow_approvals
      SET 
        status = CASE WHEN p_action = 'approve' THEN 'approved'::approval_status ELSE 'rejected'::approval_status END,
        approved_at = now(),
        approved_by = token_record.created_by,
        comments = 'Aprovado via email em ' || now()
      WHERE id = token_record.approval_id;
      
      result := json_build_object(
        'success', true,
        'type', 'workflow_approval',
        'message', CASE WHEN p_action = 'approve' THEN 'Aprovação realizada com sucesso' ELSE 'Rejeição realizada com sucesso' END
      );
    END IF;
  END IF;
  
  -- Processar solicitação de acesso
  IF token_record.access_request_id IS NOT NULL THEN
    SELECT * INTO access_request_record
    FROM public.pending_access_requests
    WHERE id = token_record.access_request_id;
    
    IF FOUND THEN
      -- Processar usando função existente
      SELECT public.process_access_request_approval(
        token_record.access_request_id,
        p_action = 'approve',
        CASE WHEN p_action = 'reject' THEN 'Rejeitado via email em ' || now() ELSE NULL END
      ) INTO result;
    END IF;
  END IF;
  
  -- Log da ação
  INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
  VALUES (
    token_record.id,
    'email_approval_processed',
    p_action,
    'token_used',
    token_record.created_by,
    'approval_token'
  );
  
  RETURN COALESCE(result, json_build_object('success', false, 'message', 'Erro ao processar aprovação'));
END;
$$;