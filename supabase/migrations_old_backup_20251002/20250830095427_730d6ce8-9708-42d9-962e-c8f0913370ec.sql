
-- Limpeza dos grupos econômicos (Clientes - SA1010) sem apagar as tabelas
-- Tabela dinâmica SA1010_CLIENTES: fc3d70f6-97ce-4997-967a-8fd92e615f99

BEGIN;

-- 1) Remover unidades (membros) dos grupos primeiro
DELETE FROM public.protheus_customer_group_units
WHERE protheus_table_id = 'fc3d70f6-97ce-4997-967a-8fd92e615f99'::uuid;

-- 2) Remover os grupos
DELETE FROM public.protheus_customer_groups
WHERE protheus_table_id = 'fc3d70f6-97ce-4997-967a-8fd92e615f99'::uuid;

COMMIT;
