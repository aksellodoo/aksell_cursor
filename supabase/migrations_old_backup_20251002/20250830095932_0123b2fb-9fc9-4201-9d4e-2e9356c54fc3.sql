
BEGIN;

-- 1) Remover integrantes (membros) dos grupos de Clientes (SA1010)
DELETE FROM public.protheus_customer_group_units
WHERE protheus_table_id = '80f17f00-0960-44ac-b810-6f8f1a36ccdc'::uuid;

-- 2) Remover os grupos de Clientes (SA1010)
DELETE FROM public.protheus_customer_groups
WHERE protheus_table_id = '80f17f00-0960-44ac-b810-6f8f1a36ccdc'::uuid;

COMMIT;
