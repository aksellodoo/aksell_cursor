
BEGIN;

-- 1) Limpar vínculos de fornecedores unificados com grupos de fornecedores
UPDATE public.purchases_unified_suppliers
SET economic_group_id = NULL
WHERE economic_group_id IS NOT NULL;

-- 2) Apagar todos os registros de grupos econômicos de fornecedores
DELETE FROM public.protheus_supplier_groups;

COMMIT;
