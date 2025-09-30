-- Corrigir função notify_chatter_general com search_path seguro
CREATE OR REPLACE FUNCTION public.notify_chatter_general()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  record_owner_id UUID;
  author_name TEXT;
BEGIN
  -- Buscar nome do autor
  SELECT name INTO author_name FROM public.profiles WHERE id = NEW.author_id;
  
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
          author_name || ' enviou uma mensagem no seu chatter',
          jsonb_build_object(
            'chatter_message_id', NEW.id,
            'record_type', NEW.record_type,
            'record_id', NEW.record_id,
            'author_id', NEW.author_id,
            'author_name', author_name
          )
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Corrigir função notify_chatter_mentions com search_path seguro  
CREATE OR REPLACE FUNCTION public.notify_chatter_mentions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  mentioned_user UUID;
  author_name TEXT;
  record_name TEXT;
BEGIN
  -- Buscar nome do autor
  SELECT name INTO author_name FROM public.profiles WHERE id = NEW.author_id;
  
  -- Criar notificações para usuários mencionados
  IF NEW.mentioned_users IS NOT NULL THEN
    FOREACH mentioned_user IN ARRAY NEW.mentioned_users
    LOOP
      -- Verificar se o usuário quer receber notificações
      IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = mentioned_user 
        AND notification_app = true 
        AND (notification_types->'mentions')::boolean = true
      ) THEN
        INSERT INTO public.app_notifications (user_id, type, title, message, data)
        VALUES (
          mentioned_user,
          'mention',
          'Você foi mencionado',
          author_name || ' mencionou você em ' || NEW.record_type,
          jsonb_build_object(
            'chatter_message_id', NEW.id,
            'record_type', NEW.record_type,
            'record_id', NEW.record_id,
            'author_id', NEW.author_id,
            'author_name', author_name
          )
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;