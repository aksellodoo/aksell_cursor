
-- Adiciona a coluna "Distância em Km até Indaiatuba" na tabela de cidades
ALTER TABLE public.site_cities
ADD COLUMN IF NOT EXISTS distance_km_to_indaiatuba numeric(10,2);

-- Documenta a coluna com o rótulo em português
COMMENT ON COLUMN public.site_cities.distance_km_to_indaiatuba
IS 'Distância em Km até Indaiatuba';
