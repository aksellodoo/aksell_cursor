-- Adicionar campos de controle de timestamps na tabela user_protheus_table_notifications
ALTER TABLE public.user_protheus_table_notifications 
ADD COLUMN last_notification_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN last_record_updated_at TIMESTAMP WITH TIME ZONE;