-- Migration: fix_form_responses_fk
-- Created: 2025-10-02 22:54:58
-- Description: Corrigir Foreign Key de form_responses.submitted_by para apontar para public.users ao invés de auth.users

-- 1. Remover a Foreign Key antiga que aponta para auth.users
ALTER TABLE public.form_responses
DROP CONSTRAINT IF EXISTS form_responses_submitted_by_fkey;

-- 2. Criar nova Foreign Key apontando para public.users
ALTER TABLE public.form_responses
ADD CONSTRAINT form_responses_submitted_by_fkey
FOREIGN KEY (submitted_by)
REFERENCES public.users(id)
ON DELETE CASCADE;

-- 3. Criar índice para melhorar performance do JOIN
CREATE INDEX IF NOT EXISTS idx_form_responses_submitted_by
ON public.form_responses(submitted_by);

-- Comentário para documentação
COMMENT ON CONSTRAINT form_responses_submitted_by_fkey ON public.form_responses IS
'Foreign Key corrigida para apontar para public.users ao invés de auth.users - Permite JOIN automático no Supabase';
