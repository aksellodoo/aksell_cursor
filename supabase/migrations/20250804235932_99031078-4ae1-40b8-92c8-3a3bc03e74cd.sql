-- Limpar entrada da tabela dinâmica
DELETE FROM public.protheus_dynamic_tables 
WHERE supabase_table_name = 'protheus_sa1010_721f869c';

-- Remover a tabela SA1010 existente
DROP TABLE IF EXISTS public.protheus_sa1010_721f869c;