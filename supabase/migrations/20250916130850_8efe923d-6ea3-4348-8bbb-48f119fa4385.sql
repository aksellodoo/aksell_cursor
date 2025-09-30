-- Tabela para cache distribuído de processamento
CREATE TABLE public.processing_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key text NOT NULL UNIQUE,
  cache_type text NOT NULL DEFAULT 'ocr', -- 'ocr', 'embedding', 'quality_analysis'
  content_hash text NOT NULL,
  cached_data jsonb NOT NULL,
  api_provider text, -- 'openai_gpt4o', 'openai_gpt4o_mini', 'anthropic_claude', 'tesseract'
  file_size bigint,
  page_number integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  access_count integer NOT NULL DEFAULT 1,
  last_accessed timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela para métricas de performance do processamento
CREATE TABLE public.processing_performance_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  processing_session_id text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  total_pages integer,
  
  -- Timing metrics
  total_processing_time_ms integer,
  text_extraction_time_ms integer,
  ocr_processing_time_ms integer,
  embedding_time_ms integer,
  
  -- Quality metrics  
  overall_quality_score numeric(3,2), -- 0.00 to 1.00
  ocr_confidence_avg numeric(3,2),
  pages_requiring_ocr integer DEFAULT 0,
  pages_native_text integer DEFAULT 0,
  
  -- Cache metrics
  cache_hits integer DEFAULT 0,
  cache_misses integer DEFAULT 0,
  
  -- Processing decisions
  processing_mode text, -- 'auto', 'ocr_all', 'text_only'
  early_stopping_triggered boolean DEFAULT false,
  adaptive_dpi_used integer, -- actual DPI used
  
  -- API usage
  api_calls_made jsonb DEFAULT '{}', -- {"openai": 3, "anthropic": 1}
  estimated_cost_usd numeric(10,4),
  
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela para health check das APIs externas
CREATE TABLE public.api_health_status (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider text NOT NULL, -- 'openai', 'anthropic', 'google', 'tesseract'
  service text NOT NULL, -- 'gpt-4o', 'claude-3-sonnet', 'vision-api', 'ocr'
  status text NOT NULL DEFAULT 'unknown', -- 'healthy', 'degraded', 'down', 'unknown'
  response_time_ms integer,
  error_rate_percent numeric(5,2),
  last_check timestamp with time zone NOT NULL DEFAULT now(),
  last_error_message text,
  consecutive_failures integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  UNIQUE(provider, service)
);

-- Índices para performance
CREATE INDEX idx_processing_cache_key ON public.processing_cache(cache_key);
CREATE INDEX idx_processing_cache_hash ON public.processing_cache(content_hash);
CREATE INDEX idx_processing_cache_expires ON public.processing_cache(expires_at);
CREATE INDEX idx_processing_cache_type ON public.processing_cache(cache_type);

CREATE INDEX idx_performance_metrics_session ON public.processing_performance_metrics(processing_session_id);
CREATE INDEX idx_performance_metrics_document ON public.processing_performance_metrics(document_id);
CREATE INDEX idx_performance_metrics_created ON public.processing_performance_metrics(created_at);

CREATE INDEX idx_api_health_provider ON public.api_health_status(provider, service);
CREATE INDEX idx_api_health_status ON public.api_health_status(status);
CREATE INDEX idx_api_health_last_check ON public.api_health_status(last_check);

-- Função para limpeza automática de cache expirado
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.processing_cache 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  INSERT INTO public.cron_job_logs (job_name, status, details)
  VALUES ('cleanup_expired_cache', 'success', 
          json_build_object('deleted_entries', deleted_count));
  
  RETURN deleted_count;
END;
$$;

-- Função para atualizar métricas de acesso ao cache
CREATE OR REPLACE FUNCTION update_cache_access(p_cache_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.processing_cache 
  SET access_count = access_count + 1,
      last_accessed = now()
  WHERE cache_key = p_cache_key;
END;
$$;

-- RLS policies
ALTER TABLE public.processing_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_health_status ENABLE ROW LEVEL SECURITY;

-- Cache: sistema pode criar/ler, usuários podem ler
CREATE POLICY "System can manage cache" ON public.processing_cache
  FOR ALL USING (true) WITH CHECK (true);

-- Métricas: sistema pode criar, usuários autenticados podem ler
CREATE POLICY "System can create performance metrics" ON public.processing_performance_metrics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view performance metrics" ON public.processing_performance_metrics
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- API Health: sistema pode gerenciar, usuários podem ler
CREATE POLICY "System can manage api health" ON public.api_health_status
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users can view api health" ON public.api_health_status
  FOR SELECT USING (auth.uid() IS NOT NULL);