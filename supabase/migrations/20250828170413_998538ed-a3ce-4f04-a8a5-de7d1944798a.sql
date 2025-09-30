-- 1) Adicionar colunas de timestamp para controle de quando foi calculado
ALTER TABLE public.site_cities
  ADD COLUMN IF NOT EXISTS distance_last_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS time_last_updated_at timestamptz;

-- 2) Normalizar país/UF para garantir consistência
UPDATE public.site_cities
SET country = 'Brasil'
WHERE (country IS NULL OR trim(country) = '');

-- Também normalizar casos onde pode estar "Brazil" em inglês
UPDATE public.site_cities
SET country = 'Brasil'
WHERE trim(lower(country)) = 'brazil';

-- 3) Índices para melhor performance nas consultas de timestamp
CREATE INDEX IF NOT EXISTS idx_site_cities_distance_updated ON public.site_cities (distance_last_updated_at);
CREATE INDEX IF NOT EXISTS idx_site_cities_time_updated ON public.site_cities (time_last_updated_at);