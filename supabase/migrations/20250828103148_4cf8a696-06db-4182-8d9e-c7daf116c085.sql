-- Remove population_est_2021 column from site_cities table
ALTER TABLE public.site_cities DROP COLUMN IF EXISTS population_est_2021;