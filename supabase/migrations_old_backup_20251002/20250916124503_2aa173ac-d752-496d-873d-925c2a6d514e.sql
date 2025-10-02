-- Create table for OCR cache management
CREATE TABLE public.ocr_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ocr_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for cache access
CREATE POLICY "Service role can manage cache" 
ON public.ocr_cache 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Create index for fast cache key lookup
CREATE INDEX idx_ocr_cache_key ON public.ocr_cache(cache_key);

-- Create index for cleanup of expired entries
CREATE INDEX idx_ocr_cache_expires_at ON public.ocr_cache(expires_at);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ocr_cache_updated_at
BEFORE UPDATE ON public.ocr_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to cleanup expired cache entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.ocr_cache 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;