-- Add country field to site_cities table
ALTER TABLE public.site_cities 
ADD COLUMN country text NOT NULL DEFAULT 'Brasil';