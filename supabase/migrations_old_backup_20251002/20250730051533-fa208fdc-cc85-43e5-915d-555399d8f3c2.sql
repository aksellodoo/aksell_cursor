-- Corrigir warning de segurança: Function Search Path Mutable
-- Recriar função process_unified_approval com search_path correto

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