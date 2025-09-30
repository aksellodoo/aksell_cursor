
-- Adiciona o campo "Tempo Médio de Viagem de Caminhão" (em horas, com duas casas decimais)
ALTER TABLE public.site_cities
ADD COLUMN IF NOT EXISTS average_truck_travel_time_hours numeric(6,2);

-- Documenta a coluna com o rótulo em português e unidade
COMMENT ON COLUMN public.site_cities.average_truck_travel_time_hours
IS 'Tempo médio de viagem de caminhão (horas)';
