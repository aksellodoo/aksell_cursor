-- Criar tabela para mensagens do chatter
CREATE TABLE public.chatter_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record_type TEXT NOT NULL,
  record_id UUID NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'internal' CHECK (message_type IN ('internal', 'external')),
  subject TEXT,
  message TEXT NOT NULL,
  author_id UUID NOT NULL,
  mentioned_users UUID[],
  attachments JSONB DEFAULT '[]'::jsonb,
  parent_message_id UUID REFERENCES public.chatter_messages(id),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para notificações no app
CREATE TABLE public.app_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar campos de preferências de notificação na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN notification_email BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN notification_app BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN notification_frequency TEXT NOT NULL DEFAULT 'instant' CHECK (notification_frequency IN ('instant', 'daily', 'weekly')),
ADD COLUMN notification_types JSONB NOT NULL DEFAULT '{"chatter": true, "mentions": true, "changes": true, "assignments": true}'::jsonb;

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.chatter_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;

-- Policies para chatter_messages
CREATE POLICY "Users can view chatter messages for accessible records" 
ON public.chatter_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create chatter messages" 
ON public.chatter_messages 
FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own chatter messages" 
ON public.chatter_messages 
FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own chatter messages" 
ON public.chatter_messages 
FOR DELETE 
USING (auth.uid() = author_id);

-- Policies para app_notifications
CREATE POLICY "Users can view their own notifications" 
ON public.app_notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.app_notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" 
ON public.app_notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" 
ON public.app_notifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar índices para performance
CREATE INDEX idx_chatter_messages_record ON public.chatter_messages(record_type, record_id);
CREATE INDEX idx_chatter_messages_author ON public.chatter_messages(author_id);
CREATE INDEX idx_chatter_messages_created_at ON public.chatter_messages(created_at DESC);
CREATE INDEX idx_chatter_messages_parent ON public.chatter_messages(parent_message_id);

CREATE INDEX idx_app_notifications_user ON public.app_notifications(user_id);
CREATE INDEX idx_app_notifications_unread ON public.app_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_app_notifications_created_at ON public.app_notifications(created_at DESC);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_chatter_messages_updated_at
BEFORE UPDATE ON public.chatter_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar notificações automáticas do chatter
CREATE OR REPLACE FUNCTION public.notify_chatter_mentions()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para notificações de menções
CREATE TRIGGER chatter_mentions_notification
AFTER INSERT ON public.chatter_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_chatter_mentions();