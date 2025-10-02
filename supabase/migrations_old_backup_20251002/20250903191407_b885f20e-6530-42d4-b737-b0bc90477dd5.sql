
-- 1) Garantir enum de atendimento (reuso do lead_attendance_type)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'lead_attendance_type'
  ) THEN
    CREATE TYPE public.lead_attendance_type AS ENUM ('direct', 'representative');
  END IF;
END
$$;

-- 2) Adicionar colunas em purchases_potential_suppliers
ALTER TABLE public.purchases_potential_suppliers
  ADD COLUMN IF NOT EXISTS attendance_type public.lead_attendance_type NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS representative_id uuid NULL;

-- 3) FK representative_id -> commercial_representatives(id)
ALTER TABLE public.purchases_potential_suppliers
  ADD CONSTRAINT IF NOT EXISTS purchases_potential_suppliers_representative_fk
  FOREIGN KEY (representative_id) REFERENCES public.commercial_representatives(id) ON DELETE SET NULL;

-- 4) Índice para representative_id
CREATE INDEX IF NOT EXISTS idx_purch_ps_representative_id
  ON public.purchases_potential_suppliers(representative_id);

-- 5) Trigger de validação do tipo de atendimento (compras)
CREATE OR REPLACE FUNCTION public.tg_validate_potential_supplier_attendance()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_is_purchases boolean;
BEGIN
  -- Direto => zera representative_id
  IF NEW.attendance_type = 'direct' THEN
    NEW.representative_id := NULL;
    RETURN NEW;
  END IF;

  -- Por representante => representative_id obrigatório + deve ser de COMPRAS
  IF NEW.attendance_type = 'representative' THEN
    IF NEW.representative_id IS NULL THEN
      RAISE EXCEPTION 'representative_id é obrigatório quando attendance_type = representative';
    END IF;

    SELECT is_purchases INTO v_is_purchases
    FROM public.commercial_representatives
    WHERE id = NEW.representative_id
    LIMIT 1;

    IF v_is_purchases IS DISTINCT FROM TRUE THEN
      RAISE EXCEPTION 'O representante informado deve existir e ser do tipo compras';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_validate_purchases_potential_attendance ON public.purchases_potential_suppliers;
CREATE TRIGGER trg_validate_purchases_potential_attendance
BEFORE INSERT OR UPDATE ON public.purchases_potential_suppliers
FOR EACH ROW
EXECUTE FUNCTION public.tg_validate_potential_supplier_attendance();
