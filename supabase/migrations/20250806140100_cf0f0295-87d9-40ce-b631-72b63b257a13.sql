-- Adicionar constraint única na tabela existente protheus_sa1010_4eb98c2d
-- baseada nos campos chave A1_FILIAL+A1_COD+A1_LOJA
ALTER TABLE public.protheus_sa1010_4eb98c2d 
ADD CONSTRAINT protheus_sa1010_4eb98c2d_unique_key 
UNIQUE (a1_filial, a1_cod, a1_loja);