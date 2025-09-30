-- Inserir uma solicitação de acesso de teste
INSERT INTO public.pending_access_requests (
  name,
  email,
  role,
  department,
  department_id,
  notification_email,
  notification_app,
  notification_frequency,
  status,
  request_ip_hash,
  request_user_agent
) VALUES (
  'Usuário Teste',
  'teste@exemplo.com',
  'user',
  'Geral',
  '508e2599-8434-4df9-9c46-af2619e3d919',
  true,
  true,
  'instant',
  'pending',
  'hash_teste_123',
  'Test User Agent'
);