-- Cleanup problematic access request and related data

-- Delete the problematic pending access request
DELETE FROM public.pending_access_requests 
WHERE id = 'f8e51b3b-4578-4cb6-9e99-6f4625e56aae';

-- Delete related notifications for this access request
DELETE FROM public.app_notifications 
WHERE type = 'access_request' 
AND data->>'access_request_id' = 'f8e51b3b-4578-4cb6-9e99-6f4625e56aae';

-- Delete any workflow approvals related to this request
DELETE FROM public.workflow_approvals 
WHERE workflow_execution_id IN (
  SELECT workflow_execution_id 
  FROM public.pending_access_requests 
  WHERE id = 'f8e51b3b-4578-4cb6-9e99-6f4625e56aae'
);

-- Also delete any approval tokens related to this request
DELETE FROM public.approval_tokens 
WHERE access_request_id = 'f8e51b3b-4578-4cb6-9e99-6f4625e56aae';