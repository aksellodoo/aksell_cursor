-- Remover notificações relacionadas à solicitação de acesso
DELETE FROM public.app_notifications 
WHERE data->>'access_request_id' = 'f24d2d17-f149-4b15-8a0d-b45151791f5f';

-- Remover a solicitação de acesso pendente
DELETE FROM public.pending_access_requests 
WHERE id = 'f24d2d17-f149-4b15-8a0d-b45151791f5f';