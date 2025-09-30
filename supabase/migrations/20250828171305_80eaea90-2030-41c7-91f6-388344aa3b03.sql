
-- 1) Adicionar colunas de cache de geocodificação
ALTER TABLE public.site_cities
  ADD COLUMN IF NOT EXISTS g_place_id text,
  ADD COLUMN IF NOT EXISTS g_formatted_address text;

-- 2) Índice útil para consultas/consistência por place_id
CREATE INDEX IF NOT EXISTS idx_site_cities_g_place_id
  ON public.site_cities (g_place_id);

-- 3) Normalizar país antes do processamento (reduz ambiguidades na geocodificação)
UPDATE public.site_cities
SET country = 'Brasil'
WHERE country IS NULL OR btrim(country) = '';
