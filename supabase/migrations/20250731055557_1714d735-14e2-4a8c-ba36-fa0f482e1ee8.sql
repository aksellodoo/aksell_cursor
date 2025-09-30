-- Adicionar campo para armazenar links de publicação na tabela forms
ALTER TABLE public.forms 
ADD COLUMN publication_links jsonb DEFAULT '{}';

-- Comentário sobre a estrutura do campo publication_links:
-- {
--   "internal": "https://domain.com/formulario/form-id",
--   "external": "https://domain.com/formulario/form-id", 
--   "direct_external": "https://domain.com/forms/external/form-id"
-- }