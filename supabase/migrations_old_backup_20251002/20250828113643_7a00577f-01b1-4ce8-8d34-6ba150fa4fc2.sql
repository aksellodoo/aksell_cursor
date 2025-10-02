
-- 1) Remover índice único legado apenas em cod_munic (causador do erro)
DROP INDEX IF EXISTS public.uq_site_cities_cod_munic;

-- 2) (Segurança) Remover qualquer constraint antiga só em cod_munic, se existir
ALTER TABLE public.site_cities DROP CONSTRAINT IF EXISTS site_cities_cod_munic_key;

-- 3) Garantir que a constraint composta exista
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE c.contype = 'u'
      AND n.nspname = 'public'
      AND t.relname = 'site_cities'
      AND c.conname = 'site_cities_cod_munic_cod_uf_key'
  ) THEN
    ALTER TABLE public.site_cities
      ADD CONSTRAINT site_cities_cod_munic_cod_uf_key UNIQUE (cod_munic, cod_uf);
  END IF;
END $$;
