
BEGIN;

-- 1) Sequência dedicada para fu_id
CREATE SEQUENCE IF NOT EXISTS public.purchases_unified_suppliers_seq;

-- 2) Adicionar coluna fu_id
ALTER TABLE public.purchases_unified_suppliers
  ADD COLUMN IF NOT EXISTS fu_id text;

-- 3) Definir default automático no padrão FU-000001 (6 dígitos)
ALTER TABLE public.purchases_unified_suppliers
  ALTER COLUMN fu_id SET DEFAULT 'FU-' || lpad(nextval('public.purchases_unified_suppliers_seq')::text, 6, '0');

-- 4) Backfill para registros existentes sem fu_id
UPDATE public.purchases_unified_suppliers
SET fu_id = 'FU-' || lpad(nextval('public.purchases_unified_suppliers_seq')::text, 6, '0')
WHERE fu_id IS NULL;

-- 5) Tornar NOT NULL
ALTER TABLE public.purchases_unified_suppliers
  ALTER COLUMN fu_id SET NOT NULL;

-- 6) Garantir unicidade
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'purchases_unified_suppliers_fu_id_key'
  ) THEN
    ALTER TABLE public.purchases_unified_suppliers
      ADD CONSTRAINT purchases_unified_suppliers_fu_id_key UNIQUE (fu_id);
  END IF;
END$$;

-- 7) Impedir alterações de fu_id após criado
CREATE OR REPLACE FUNCTION public.tg_prevent_fu_id_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.fu_id IS DISTINCT FROM OLD.fu_id THEN
    RAISE EXCEPTION 'fu_id is immutable and cannot be changed';
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS prevent_fu_id_update ON public.purchases_unified_suppliers;

CREATE TRIGGER prevent_fu_id_update
BEFORE UPDATE OF fu_id ON public.purchases_unified_suppliers
FOR EACH ROW
EXECUTE FUNCTION public.tg_prevent_fu_id_update();

COMMIT;
