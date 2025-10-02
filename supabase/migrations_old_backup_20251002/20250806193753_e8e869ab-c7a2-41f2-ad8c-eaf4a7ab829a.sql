-- Etapa 1: Limpeza das tabelas duplicadas
-- Remover a entrada da tabela antiga do protheus_dynamic_tables
DELETE FROM public.protheus_dynamic_tables 
WHERE supabase_table_name = 'protheus_sa1010_4eb98c2d';

-- Remover a tabela antiga
DROP TABLE IF EXISTS public.protheus_sa1010_4eb98c2d;

-- Etapa 2: Adicionar a constraint única na tabela atual
-- Verificar se a constraint já existe e remover se necessário
ALTER TABLE public.protheus_sa1010_b0bb3b0c 
DROP CONSTRAINT IF EXISTS protheus_sa1010_b0bb3b0c_unique_key;

-- Adicionar a constraint única nos campos chave
ALTER TABLE public.protheus_sa1010_b0bb3b0c 
ADD CONSTRAINT protheus_sa1010_b0bb3b0c_unique_key 
UNIQUE (a1_filial, a1_cod, a1_loja);