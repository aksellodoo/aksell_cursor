-- Atualizar função notify_chatter_general para incluir mais contexto
CREATE OR REPLACE FUNCTION public.notify_chatter_general()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  record_owner_id UUID;
  author_name TEXT;
  record_name TEXT;
  page_name TEXT;
  message_preview TEXT;
BEGIN
  -- Buscar nome do autor
  SELECT name INTO author_name FROM public.profiles WHERE id = NEW.author_id;
  
  -- Determinar página e nome do registro baseado no record_type
  CASE NEW.record_type
    WHEN 'user' THEN
      SELECT name INTO record_name FROM public.profiles WHERE id = NEW.record_id::UUID;
      page_name := 'Usuários';
    WHEN 'department' THEN
      SELECT name INTO record_name FROM public.departments WHERE id = NEW.record_id::UUID;
      page_name := 'Departamentos';
    ELSE
      page_name := NEW.record_type;
      record_name := NEW.record_id;
  END CASE;

  -- Criar preview da mensagem (primeiros 100 caracteres)
  message_preview := LEFT(NEW.message, 100);
  IF LENGTH(NEW.message) > 100 THEN
    message_preview := message_preview || '...';
  END IF;
  
  -- Para mensagens no chatter de usuários, notificar o dono do perfil
  IF NEW.record_type = 'user' THEN
    record_owner_id := NEW.record_id::UUID;
    
    -- Não notificar o próprio autor
    IF record_owner_id != NEW.author_id THEN
      -- Verificar se o usuário quer receber notificações
      IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = record_owner_id 
        AND notification_app = true 
        AND (notification_types->'chatter')::boolean = true
      ) THEN
        INSERT INTO public.app_notifications (user_id, type, title, message, data)
        VALUES (
          record_owner_id,
          'chatter_message',
          'Nova mensagem no seu perfil',
          author_name || ' enviou uma mensagem no seu chatter: "' || message_preview || '"',
          jsonb_build_object(
            'chatter_message_id', NEW.id,
            'record_type', NEW.record_type,
            'record_id', NEW.record_id,
            'record_name', record_name,
            'page_name', page_name,
            'author_id', NEW.author_id,
            'author_name', author_name,
            'message_preview', message_preview,
            'navigation_url', '/usuarios'
          )
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$