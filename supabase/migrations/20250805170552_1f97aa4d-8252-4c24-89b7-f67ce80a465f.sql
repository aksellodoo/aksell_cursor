-- Deletar tabela dinâmica existente
DROP TABLE IF EXISTS public.protheus_sa1010_4eb98c2d;

-- Limpar registros relacionados na tabela de mapeamento
DELETE FROM public.protheus_dynamic_tables 
WHERE supabase_table_name = 'protheus_sa1010_4eb98c2d';

-- Limpar logs de sincronização relacionados
DELETE FROM public.protheus_sync_logs 
WHERE supabase_table_name = 'protheus_sa1010_4eb98c2d';