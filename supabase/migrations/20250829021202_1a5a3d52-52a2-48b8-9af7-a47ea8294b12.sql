
-- Add 'mode' column to track how the job should process cities
ALTER TABLE public.site_city_distance_jobs
ADD COLUMN mode text NOT NULL DEFAULT 'fill_empty';

-- Ensure only expected values are used
ALTER TABLE public.site_city_distance_jobs
ADD CONSTRAINT site_city_distance_jobs_mode_chk
CHECK (mode IN ('fill_empty', 'overwrite', 'geocode_non_matrix'));
