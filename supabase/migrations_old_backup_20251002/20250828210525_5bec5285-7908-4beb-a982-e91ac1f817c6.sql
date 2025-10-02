-- Add columns to track route status and distance calculation method
ALTER TABLE public.site_cities 
ADD COLUMN route_unavailable boolean DEFAULT false,
ADD COLUMN distance_source text DEFAULT 'google_maps',
ADD COLUMN route_status text DEFAULT NULL;

-- Add index for better performance when filtering by route status
CREATE INDEX idx_site_cities_route_status ON public.site_cities(route_status);
CREATE INDEX idx_site_cities_distance_source ON public.site_cities(distance_source);