-- Limpar dados da tabela SA1010 para permitir novo teste

-- 1. Remover entrada do registro de tabelas dinâmicas
DELETE FROM public.protheus_dynamic_tables 
WHERE supabase_table_name = 'protheus_sa1010_721f869c';

-- 2. Remover a tabela física criada
DROP TABLE IF EXISTS public.protheus_sa1010_721f869c;