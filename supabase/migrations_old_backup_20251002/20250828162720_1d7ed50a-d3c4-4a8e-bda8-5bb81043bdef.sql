-- Criar tabela para gerenciar jobs de cálculo de distância
CREATE TABLE IF NOT EXISTS public.site_city_distance_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'cancelled', 'completed', 'failed')),
  only_fill_empty boolean NOT NULL DEFAULT true,
  total_cities integer NOT NULL DEFAULT 0,
  processed_cities integer NOT NULL DEFAULT 0,
  failed_cities integer NOT NULL DEFAULT 0,
  last_offset integer DEFAULT 0,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  started_at timestamp with time zone,
  finished_at timestamp with time zone
);

-- Criar tabela para log de erros por cidade
CREATE TABLE IF NOT EXISTS public.site_city_distance_errors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES public.site_city_distance_jobs(id) ON DELETE CASCADE,
  city_id uuid NOT NULL REFERENCES public.site_cities(id) ON DELETE CASCADE,
  reason text NOT NULL,
  payload jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Índice para evitar jobs simultâneos por usuário
CREATE UNIQUE INDEX IF NOT EXISTS one_running_city_distance_job_per_user
ON public.site_city_distance_jobs (created_by)
WHERE status IN ('queued', 'running');

-- RLS para site_city_distance_jobs
ALTER TABLE public.site_city_distance_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own distance jobs"
ON public.site_city_distance_jobs
FOR SELECT
USING (auth.uid() = created_by);

CREATE POLICY "System can manage distance jobs"
ON public.site_city_distance_jobs
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS para site_city_distance_errors
ALTER TABLE public.site_city_distance_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view errors for their jobs"
ON public.site_city_distance_errors
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.site_city_distance_jobs j
  WHERE j.id = site_city_distance_errors.job_id
  AND j.created_by = auth.uid()
));

CREATE POLICY "System can manage distance errors"
ON public.site_city_distance_errors
FOR ALL
USING (true)
WITH CHECK (true);