
-- 1) Criar sequence para o número sequencial (se não existir)
CREATE SEQUENCE IF NOT EXISTS public.potential_supplier_pf_number_seq;

-- 2) Adicionar coluna pf_number (inteiro) se ainda não existir
ALTER TABLE public.purchases_potential_suppliers
  ADD COLUMN IF NOT EXISTS pf_number integer;

-- 3) Preencher pf_number para registros existentes (ordem por created_at para manter cronologia)
WITH ordered AS (
  SELECT id
  FROM public.purchases_potential_suppliers
  WHERE pf_number IS NULL
  ORDER BY created_at, id
)
UPDATE public.purchases_potential_suppliers p
SET pf_number = nextval('public.potential_supplier_pf_number_seq')
FROM ordered o
WHERE p.id = o.id
  AND p.pf_number IS NULL;

-- 4) Definir default da coluna para usar a sequence daqui em diante
ALTER TABLE public.purchases_potential_suppliers
  ALTER COLUMN pf_number SET DEFAULT nextval('public.potential_supplier_pf_number_seq');

-- 5) Garantir que a sequence continue do maior valor já usado
SELECT setval(
  'public.potential_supplier_pf_number_seq',
  COALESCE((SELECT MAX(pf_number) FROM public.purchases_potential_suppliers), 0)
);

-- 6) Vincular a sequence à coluna (ownership)
ALTER SEQUENCE public.potential_supplier_pf_number_seq
OWNED BY public.purchases_potential_suppliers.pf_number;

-- 7) Tornar a coluna NOT NULL após o preenchimento
ALTER TABLE public.purchases_potential_suppliers
  ALTER COLUMN pf_number SET NOT NULL;

-- 8) Índice único para o número
CREATE UNIQUE INDEX IF NOT EXISTS purchases_potential_suppliers_pf_number_key
ON public.purchases_potential_suppliers(pf_number);

-- 9) Adicionar coluna gerada pf_code = 'PF-' || pf_number
ALTER TABLE public.purchases_potential_suppliers
  ADD COLUMN IF NOT EXISTS pf_code text
  GENERATED ALWAYS AS ('PF-' || pf_number::text) STORED;

-- 10) Índice único para o código legível
CREATE UNIQUE INDEX IF NOT EXISTS purchases_potential_suppliers_pf_code_key
ON public.purchases_potential_suppliers(pf_code);
