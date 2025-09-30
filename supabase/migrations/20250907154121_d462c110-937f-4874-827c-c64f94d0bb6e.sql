
-- 1) Adiciona campos para cargo/função e departamento no cadastro de contatos
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS department text;

-- Observação:
-- - Mantemos como texto e opcionais no BD para compatibilidade com dados já existentes.
-- - A obrigatoriedade de "department" será aplicada no front-end (validação do formulário).
