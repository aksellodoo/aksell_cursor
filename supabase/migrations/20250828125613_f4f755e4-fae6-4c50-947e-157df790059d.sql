
-- 1) Adicionar novas colunas em site_cities
ALTER TABLE public.site_cities
  ADD COLUMN IF NOT EXISTS codigo_ibge text,
  ADD COLUMN IF NOT EXISTS latitude numeric(9,6),
  ADD COLUMN IF NOT EXISTS longitude numeric(9,6),
  ADD COLUMN IF NOT EXISTS capital smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS siafi_id text,
  ADD COLUMN IF NOT EXISTS ddd text,
  ADD COLUMN IF NOT EXISTS fuso_horario text;

-- 2) Garantir que capital só aceite 0 ou 1
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conname = 'ck_site_cities_capital_01'
  ) THEN
    ALTER TABLE public.site_cities
      ADD CONSTRAINT ck_site_cities_capital_01 CHECK (capital IN (0, 1));
  END IF;
END $$;

-- 3) Backfill: popular codigo_ibge com cod_munic quando estiver nulo
UPDATE public.site_cities
SET codigo_ibge = cod_munic
WHERE codigo_ibge IS NULL
  AND cod_munic IS NOT NULL;
