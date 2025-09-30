-- Limpar completamente a tabela SA1010 e registros relacionados

-- 1. Remover o mapeamento da tabela dinâmica
DELETE FROM public.protheus_dynamic_tables 
WHERE supabase_table_name = 'protheus_sa1010_4eb98c2d';

-- 2. Limpar logs relacionados na tabela de auditoria
DELETE FROM public.field_audit_log 
WHERE record_type = 'protheus_table' 
   OR old_value LIKE '%protheus_sa1010_4eb98c2d%' 
   OR new_value LIKE '%protheus_sa1010_4eb98c2d%';

-- 3. Limpar logs de sincronização do Protheus se existirem
DELETE FROM public.protheus_sync_logs 
WHERE table_name = 'protheus_sa1010_4eb98c2d';

-- 4. Dropar a tabela física
DROP TABLE IF EXISTS public.protheus_sa1010_4eb98c2d;