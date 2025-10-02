
BEGIN;

-- 1) Remover vínculos de tags relacionados a fornecedores unificados
DELETE FROM public.purchases_unified_supplier_tags t
USING public.purchases_unified_suppliers s
WHERE t.supplier_id = s.id;

-- 2) Excluir todos os fornecedores unificados
DELETE FROM public.purchases_unified_suppliers;

COMMIT;
