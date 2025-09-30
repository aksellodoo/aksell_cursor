
-- 1) Adiciona coluna numérica para o ID sequencial
ALTER TABLE public.sales_leads
  ADD COLUMN IF NOT EXISTS lead_number integer;

-- 2) Popula sequencialmente os registros existentes (ordenados por created_at, id)
WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS rn
  FROM public.sales_leads
  WHERE lead_number IS NULL
)
UPDATE public.sales_leads t
SET lead_number = o.rn
FROM ordered o
WHERE t.id = o.id;

-- 3) Cria a sequência (se ainda não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S'
      AND n.nspname = 'public'
      AND c.relname = 'sales_leads_lead_number_seq'
  ) THEN
    CREATE SEQUENCE public.sales_leads_lead_number_seq
      START WITH 1
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1;
  END IF;
END $$;

-- 4) Ajusta a sequência para continuar após o maior lead_number atual
SELECT setval(
  'public.sales_leads_lead_number_seq',
  GREATEST((SELECT COALESCE(MAX(lead_number), 0) FROM public.sales_leads), 0)
);

-- 5) Define default, NOT NULL e unicidade para lead_number
ALTER TABLE public.sales_leads
  ALTER COLUMN lead_number SET DEFAULT nextval('public.sales_leads_lead_number_seq'),
  ALTER COLUMN lead_number SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS sales_leads_lead_number_key
  ON public.sales_leads(lead_number);

-- 6) Adiciona coluna gerada com o formato 'L-<lead_number>'
ALTER TABLE public.sales_leads
  ADD COLUMN IF NOT EXISTS lead_code text GENERATED ALWAYS AS ('L-' || lead_number::text) STORED;

-- 7) Garante unicidade do lead_code (opcional, mas recomendado)
CREATE UNIQUE INDEX IF NOT EXISTS sales_leads_lead_code_key
  ON public.sales_leads(lead_code);
