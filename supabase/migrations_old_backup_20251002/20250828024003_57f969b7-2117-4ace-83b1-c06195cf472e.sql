-- Add unique constraint to prevent duplicate cities and enable efficient upsert
ALTER TABLE public.site_cities 
ADD CONSTRAINT uq_site_cities_cod_munic 
UNIQUE (cod_munic, cod_uf);