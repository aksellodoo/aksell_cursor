-- Remove the existing unique constraint on cod_munic only
ALTER TABLE site_cities DROP CONSTRAINT IF EXISTS site_cities_cod_munic_key;

-- Add a composite unique constraint on cod_munic + cod_uf
ALTER TABLE site_cities ADD CONSTRAINT site_cities_cod_munic_cod_uf_key UNIQUE (cod_munic, cod_uf);