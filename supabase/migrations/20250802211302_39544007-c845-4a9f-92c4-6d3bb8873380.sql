-- Corrigir trigger de notificações para evitar duplicação
-- Primeiro, vamos dropar o trigger problemático e criar um novo

-- Dropar triggers existentes se houver duplicação
DROP TRIGGER IF EXISTS notify_new_access_request ON public.pending_access_requests;
DROP TRIGGER IF EXISTS notify_access_request ON public.pending_access_requests;

-- Limpar notificações duplicadas da solicitação atual
DELETE FROM public.app_notifications 
WHERE type = 'access_request' 
  AND data->>'access_request_id' = '05c5af87-9363-40da-919f-7f0e397b153e'
  AND id NOT IN (
    SELECT DISTINCT ON (user_id) id 
    FROM public.app_notifications 
    WHERE type = 'access_request' 
      AND data->>'access_request_id' = '05c5af87-9363-40da-919f-7f0e397b153e'
    ORDER BY user_id, created_at DESC
  );

-- Criar nova função que evita duplicações
CREATE OR REPLACE FUNCTION public.notify_access_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Criar notificação apenas para administradores e diretores
  -- Evitar duplicações verificando se já existe notificação para esta solicitação
  INSERT INTO public.app_notifications (user_id, type, title, message, data)
  SELECT DISTINCT
    p.id,
    'access_request',
    'Nova solicitação de acesso',
    'Usuário ' || NEW.name || ' solicitou acesso ao sistema',
    jsonb_build_object(
      'access_request_id', NEW.id,
      'requester_name', NEW.name,
      'requester_email', NEW.email,
      'department', NEW.department,
      'role', NEW.role
    )
  FROM public.profiles p
  WHERE p.role IN ('admin', 'director') 
    AND p.notification_app = true
    AND p.status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM public.app_notifications 
      WHERE user_id = p.id 
        AND type = 'access_request'
        AND data->>'access_request_id' = NEW.id::text
    );
  
  RETURN NEW;
END;
$$;

-- Criar o trigger correto
CREATE TRIGGER notify_access_request
  AFTER INSERT ON public.pending_access_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_access_request();