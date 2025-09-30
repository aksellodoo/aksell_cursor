-- Fix the search path security issue for the process_unified_approval function
DROP FUNCTION IF EXISTS public.process_unified_approval(uuid, text, text);

CREATE OR REPLACE FUNCTION public.process_unified_approval(
  p_approval_id uuid,
  p_action text,
  p_comments text DEFAULT ''
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  approval_record RECORD;
  request_record RECORD;
  result json;
BEGIN
  -- Get the approval record
  SELECT * INTO approval_record
  FROM public.workflow_approvals
  WHERE id = p_approval_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Approval not found');
  END IF;
  
  -- Update the approval status
  UPDATE public.workflow_approvals
  SET 
    status = p_action::approval_status,
    comments = p_comments,
    approved_at = CASE WHEN p_action = 'approved' THEN now() ELSE NULL END,
    approved_by = auth.uid(),
    updated_at = now()
  WHERE id = p_approval_id;
  
  -- Handle access request approvals specifically
  IF approval_record.approval_type = 'access_request' THEN
    -- Get the access request ID from approval_data
    DECLARE
      request_id uuid;
    BEGIN
      request_id := (approval_record.approval_data->>'request_id')::uuid;
      
      IF request_id IS NOT NULL THEN
        -- Process the access request using existing function
        SELECT public.process_access_request_approval(
          request_id,
          p_action = 'approved',
          CASE WHEN p_action = 'rejected' THEN p_comments ELSE NULL END
        ) INTO result;
        
        -- Return the result from access request processing
        RETURN result;
      END IF;
    END;
  END IF;
  
  -- For other approval types, just update status and return success
  RETURN json_build_object(
    'success', true,
    'message', 'Approval processed successfully',
    'approval_id', p_approval_id,
    'action', p_action
  );
END;
$$;