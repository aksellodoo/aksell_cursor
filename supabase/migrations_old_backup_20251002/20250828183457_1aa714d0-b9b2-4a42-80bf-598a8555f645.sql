-- Add new columns to track geocoding phase progress
ALTER TABLE public.site_city_distance_jobs 
ADD COLUMN phase text DEFAULT 'geocoding' CHECK (phase IN ('geocoding', 'matrix')),
ADD COLUMN geocoded_cities integer DEFAULT 0,
ADD COLUMN geocoding_started_at timestamp with time zone,
ADD COLUMN geocoding_finished_at timestamp with time zone;