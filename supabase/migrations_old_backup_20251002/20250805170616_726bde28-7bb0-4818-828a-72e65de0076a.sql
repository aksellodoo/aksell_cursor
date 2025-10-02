-- Deletar tabela dinâmica existente
DROP TABLE IF EXISTS public.protheus_sa1010_4eb98c2d;

-- Limpar registros relacionados na tabela de mapeamento
DELETE FROM public.protheus_dynamic_tables 
WHERE supabase_table_name = 'protheus_sa1010_4eb98c2d';

-- Limpar logs de sincronização relacionados (usando protheus_table_id)
DELETE FROM public.protheus_sync_logs psl
WHERE EXISTS (
  SELECT 1 FROM public.protheus_tables pt 
  WHERE pt.id = psl.protheus_table_id 
  AND pt.table_name = 'SA1010'
);