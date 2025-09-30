
-- 1) Tornar cod_munic e cod_uf opcionais (NULL permitido)
ALTER TABLE public.site_cities
  ALTER COLUMN cod_munic DROP NOT NULL,
  ALTER COLUMN cod_uf DROP NOT NULL;

-- 2) Função de validação condicional para cidades brasileiras
CREATE OR REPLACE FUNCTION public.tg_validate_site_cities_codes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Normalizações simples
  IF NEW.country IS NOT NULL THEN
    NEW.country := btrim(NEW.country);
  END IF;
  IF NEW.uf IS NOT NULL THEN
    NEW.uf := upper(btrim(NEW.uf));
  END IF;

  -- País é Brasil? (considera variações comuns)
  IF lower(coalesce(NEW.country, '')) IN ('brasil','brazil','br') THEN
    -- Exigir códigos brasileiros
    IF NEW.cod_munic IS NULL OR btrim(NEW.cod_munic) = '' THEN
      RAISE EXCEPTION 'Cód. Munic é obrigatório para cidades do Brasil';
    END IF;
    IF NEW.cod_uf IS NULL OR btrim(NEW.cod_uf) = '' THEN
      RAISE EXCEPTION 'Cód. UF é obrigatório para cidades do Brasil';
    END IF;
    -- Validar numéricos
    IF NEW.cod_munic !~ '^[0-9]+$' THEN
      RAISE EXCEPTION 'Cód. Munic deve conter apenas números';
    END IF;
    IF NEW.cod_uf !~ '^[0-9]+$' THEN
      RAISE EXCEPTION 'Cód. UF deve conter apenas números';
    END IF;
  ELSE
    -- Para cidades fora do Brasil, limpar strings vazias para NULL
    IF NEW.cod_munic IS NOT NULL AND btrim(NEW.cod_munic) = '' THEN
      NEW.cod_munic := NULL;
    END IF;
    IF NEW.cod_uf IS NOT NULL AND btrim(NEW.cod_uf) = '' THEN
      NEW.cod_uf := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 3) Instalar o trigger
DROP TRIGGER IF EXISTS site_cities_validate_codes ON public.site_cities;
CREATE TRIGGER site_cities_validate_codes
BEFORE INSERT OR UPDATE ON public.site_cities
FOR EACH ROW EXECUTE FUNCTION public.tg_validate_site_cities_codes();
