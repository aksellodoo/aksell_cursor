-- Remove o constraint incorreto que está causando problemas no drag & drop
-- O constraint field_audit_log_user_id_fkey está forçando record_id a referenciar profiles.id
-- mas record_id é um campo genérico que pode conter IDs de qualquer tabela

ALTER TABLE public.field_audit_log DROP CONSTRAINT IF EXISTS field_audit_log_user_id_fkey;