-- Limpar dados do usuário jorgemduartejr@gmail.com para permitir novo teste

-- 1. Remover solicitações de acesso pendentes/aprovadas
DELETE FROM public.pending_access_requests 
WHERE email = 'jorgemduartejr@gmail.com';

-- 2. Remover notificações relacionadas
DELETE FROM public.app_notifications 
WHERE data::jsonb @> '{"requester_email": "jorgemduartejr@gmail.com"}';

-- 3. Remover qualquer perfil que possa existir
DELETE FROM public.profiles 
WHERE email = 'jorgemduartejr@gmail.com';

-- 4. Remover tokens de aprovação relacionados se houver
DELETE FROM public.approval_tokens 
WHERE access_request_id IN (
  SELECT id FROM public.pending_access_requests 
  WHERE email = 'jorgemduartejr@gmail.com'
);

-- Log da limpeza
INSERT INTO public.field_audit_log (record_id, field_name, old_value, new_value, changed_by, record_type)
VALUES (
  gen_random_uuid(),
  'user_cleanup',
  'jorgemduartejr@gmail.com',
  'deleted_for_testing',
  auth.uid(),
  'cleanup'
);