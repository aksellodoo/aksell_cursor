-- Remover tabelas órfãs do Protheus que não estão vinculadas
DROP TABLE IF EXISTS public.protheus_sa1010_b0bb3b0c;
DROP TABLE IF EXISTS public.protheus_sc2010_bb8766d1;

-- Limpar logs órfãos que possam estar referenciando tabelas inexistentes
DELETE FROM public.protheus_sync_logs 
WHERE protheus_table_id NOT IN (SELECT id FROM public.protheus_tables);

-- Limpar entradas órfãs da tabela de mapeamento dinâmico que não tenham protheus_table_id válido
DELETE FROM public.protheus_dynamic_tables 
WHERE protheus_table_id NOT IN (SELECT id FROM public.protheus_tables);