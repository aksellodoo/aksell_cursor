
-- Adiciona a coluna para armazenar a lista de campos selecionados
ALTER TABLE public.protheus_tables
ADD COLUMN IF NOT EXISTS selected_fields text[];
