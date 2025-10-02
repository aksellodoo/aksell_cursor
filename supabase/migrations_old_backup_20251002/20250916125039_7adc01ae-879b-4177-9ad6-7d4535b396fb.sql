-- Create table for OCR metrics and monitoring
CREATE TABLE public.ocr_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  model_used TEXT NOT NULL, -- 'gpt-4o', 'gpt-4o-mini', 'tesseract'
  processing_time_ms INTEGER,
  cost_estimate DECIMAL(8,6),
  quality_score DECIMAL(3,2),
  fallback_reason TEXT, -- 'rate_limit', 'timeout', 'error', 'quality_low', null
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ocr_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for metrics access
CREATE POLICY "Service role can manage metrics" 
ON public.ocr_metrics 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Create indexes for performance
CREATE INDEX idx_ocr_metrics_document_id ON public.ocr_metrics(document_id);
CREATE INDEX idx_ocr_metrics_model_used ON public.ocr_metrics(model_used);
CREATE INDEX idx_ocr_metrics_created_at ON public.ocr_metrics(created_at);

-- Create function to get OCR model performance stats
CREATE OR REPLACE FUNCTION public.get_ocr_model_stats(days_back INTEGER DEFAULT 7)
RETURNS TABLE(
  model TEXT,
  total_pages INTEGER,
  avg_processing_time_ms INTEGER,
  total_cost DECIMAL(8,6),
  avg_quality_score DECIMAL(3,2),
  fallback_rate DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    om.model_used,
    COUNT(*)::INTEGER as total_pages,
    AVG(om.processing_time_ms)::INTEGER as avg_processing_time_ms,
    SUM(om.cost_estimate) as total_cost,
    AVG(om.quality_score) as avg_quality_score,
    (COUNT(*) FILTER (WHERE om.fallback_reason IS NOT NULL)::DECIMAL / COUNT(*) * 100) as fallback_rate
  FROM public.ocr_metrics om
  WHERE om.created_at >= (now() - (days_back || ' days')::INTERVAL)
  GROUP BY om.model_used
  ORDER BY total_pages DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;