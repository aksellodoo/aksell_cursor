-- Adicionar foreign key constraint para user_protheus_table_notifications
ALTER TABLE public.user_protheus_table_notifications
ADD CONSTRAINT fk_user_protheus_table_notifications_user_id
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;