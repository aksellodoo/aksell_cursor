-- Adicionar foreign keys para corrigir os relacionamentos do Chatter

-- Adicionar foreign key para chatter_messages.author_id -> profiles.id
ALTER TABLE public.chatter_messages 
ADD CONSTRAINT chatter_messages_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Adicionar foreign key para field_audit_log.changed_by -> profiles.id
ALTER TABLE public.field_audit_log 
ADD CONSTRAINT field_audit_log_changed_by_fkey 
FOREIGN KEY (changed_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Adicionar foreign key para field_audit_log.user_id -> profiles.id (para auditoria de perfis)
ALTER TABLE public.field_audit_log 
ADD CONSTRAINT field_audit_log_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;