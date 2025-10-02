
-- Remover a tabela SA1010 atual
DROP TABLE IF EXISTS public.protheus_sa1010_721f869c;

-- Remover a entrada da tabela de mapeamento dinâmico
DELETE FROM public.protheus_dynamic_tables 
WHERE supabase_table_name = 'protheus_sa1010_721f869c';
