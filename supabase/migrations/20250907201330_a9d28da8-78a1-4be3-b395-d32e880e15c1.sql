
-- Remover e-mail alternativo e adicionar campos de endereço em public.contacts

-- 1) Remover coluna email_secondary (caso exista)
ALTER TABLE public.contacts
  DROP COLUMN IF EXISTS email_secondary;

-- 2) Adicionar colunas de endereço (caso não existam)
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS address_street        text,
  ADD COLUMN IF NOT EXISTS address_number        text,
  ADD COLUMN IF NOT EXISTS address_complement    text,
  ADD COLUMN IF NOT EXISTS address_neighborhood  text,
  ADD COLUMN IF NOT EXISTS cep                   text;
