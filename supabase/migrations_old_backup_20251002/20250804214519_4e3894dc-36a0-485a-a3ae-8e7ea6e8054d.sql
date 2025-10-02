-- Limpar dados da tabela SA1010 para permitir recriação
DELETE FROM public.protheus_dynamic_tables 
WHERE protheus_table_id IN (
  SELECT id FROM public.protheus_tables WHERE table_name = 'SA1010'
);

-- Deletar a tabela dinâmica atual se existir
DROP TABLE IF EXISTS public.protheus_sa1010_721f869c;