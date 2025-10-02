-- Limpeza completa da tabela SA1010 para testar novo método de descoberta dinâmica

-- 1. Remover a tabela de dados principal
DROP TABLE IF EXISTS public.protheus_sa1010_721f869c;

-- 2. Remover registro da tabela de estruturas dinâmicas
DELETE FROM public.protheus_dynamic_tables 
WHERE protheus_table_id = '721f869c-1b2d-4362-a3a8-3971fdddae6a';

-- 3. Remover registro da tabela principal de configuração  
DELETE FROM public.protheus_tables 
WHERE id = '721f869c-1b2d-4362-a3a8-3971fdddae6a';

-- 4. Limpar logs de auditoria relacionados
DELETE FROM public.field_audit_log 
WHERE record_type = 'protheus_table' 
AND record_id = '721f869c-1b2d-4362-a3a8-3971fdddae6a';