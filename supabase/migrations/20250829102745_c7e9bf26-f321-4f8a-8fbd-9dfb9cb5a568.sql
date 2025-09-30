-- Update existing google_maps entries to matrix for consistency
UPDATE public.site_cities 
SET distance_source = 'matrix' 
WHERE distance_source = 'google_maps';