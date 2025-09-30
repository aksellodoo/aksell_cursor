
-- 1) Adicionar coluna city_id em sales_leads (se ainda não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'sales_leads'
      AND column_name  = 'city_id'
  ) THEN
    ALTER TABLE public.sales_leads
      ADD COLUMN city_id uuid;
  END IF;
END$$;

-- 2) Chave estrangeira para site_cities (se ainda não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sales_leads_city_id_fkey'
  ) THEN
    ALTER TABLE public.sales_leads
      ADD CONSTRAINT sales_leads_city_id_fkey
      FOREIGN KEY (city_id)
      REFERENCES public.site_cities (id)
      ON DELETE SET NULL;
  END IF;
END$$;

-- 3) Índice para melhorar performance em city_id
CREATE INDEX IF NOT EXISTS idx_sales_leads_city_id
  ON public.sales_leads(city_id);

-- 4) Trigger de validação: exige city_id em novos leads (somente INSERT)
CREATE OR REPLACE FUNCTION public.tg_validate_sales_lead_city_not_null()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.city_id IS NULL THEN
      RAISE EXCEPTION 'city_id é obrigatório para criar um lead';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'tr_validate_sales_lead_city_not_null'
  ) THEN
    CREATE TRIGGER tr_validate_sales_lead_city_not_null
    BEFORE INSERT ON public.sales_leads
    FOR EACH ROW
    EXECUTE FUNCTION public.tg_validate_sales_lead_city_not_null();
  END IF;
END$$;
