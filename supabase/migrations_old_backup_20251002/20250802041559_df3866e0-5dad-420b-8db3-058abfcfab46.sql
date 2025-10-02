-- Remover notificações relacionadas à solicitação de acesso
DELETE FROM public.app_notifications 
WHERE data->>'access_request_id' = 'f24d2d17-f149-4b15-8a0d-b45151791f5f';

-- Remover a solicitação de acesso pendente
DELETE FROM public.pending_access_requests 
WHERE id = 'f24d2d17-f149-4b15-8a0d-b45151791f5f';

-- Log da limpeza para auditoria
INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
VALUES (
  'f24d2d17-f149-4b15-8a0d-b45151791f5f',
  'cleanup_access_request',
  'pending',
  'deleted_manually',
  auth.uid(),
  'access_request'
);