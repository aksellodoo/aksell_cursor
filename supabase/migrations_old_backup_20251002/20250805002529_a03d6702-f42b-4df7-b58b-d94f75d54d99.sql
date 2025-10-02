-- Remover registro da tabela dinâmica SA1010
DELETE FROM public.protheus_dynamic_tables 
WHERE id = '9c7aac04-e65b-4c48-9195-240a99883e8c';

-- Remover a tabela física SA1010
DROP TABLE IF EXISTS public.protheus_sa1010_721f869c;