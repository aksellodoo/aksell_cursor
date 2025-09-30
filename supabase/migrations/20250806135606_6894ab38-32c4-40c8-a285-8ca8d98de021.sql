-- Adicionar coluna key_fields na tabela protheus_tables
ALTER TABLE public.protheus_tables 
ADD COLUMN key_fields TEXT NOT NULL DEFAULT '';

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.protheus_tables.key_fields IS 'Campos chave da tabela Protheus separados por + (ex: A1_FILIAL+A1_COD+A1_LOJA)';

-- Atualizar tabela existente com valor padrão para SA1
UPDATE public.protheus_tables 
SET key_fields = 'A1_FILIAL+A1_COD+A1_LOJA'
WHERE table_name = 'SA1010';