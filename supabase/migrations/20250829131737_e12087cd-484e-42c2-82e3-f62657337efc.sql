
-- Remover os campos Cidade e Estado dos representantes comerciais
ALTER TABLE public.commercial_representatives
  DROP COLUMN IF EXISTS company_city,
  DROP COLUMN IF EXISTS company_state;
