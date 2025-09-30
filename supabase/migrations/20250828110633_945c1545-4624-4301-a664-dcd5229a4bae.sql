-- Rename column from population_est_2021 to population_est
ALTER TABLE public.site_cities 
RENAME COLUMN population_est_2021 TO population_est;