-- Primeiro, remover a tabela atual para recriar corretamente
DROP TABLE IF EXISTS public.protheus_sa1010_4eb98c2d CASCADE;

-- Remover registro da tabela dinâmica para permitir recriação
DELETE FROM protheus_dynamic_tables 
WHERE protheus_table_id = '4eb98c2d-7216-4abd-8802-f81568633578';