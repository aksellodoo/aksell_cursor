-- Criar tabela para logs de uso do Protheus
CREATE TABLE public.protheus_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  config_id UUID NOT NULL,
  endpoint_used TEXT NOT NULL,
  request_data JSONB NOT NULL DEFAULT '{}',
  response_status TEXT NOT NULL, -- 'success', 'error', 'timeout'
  response_data JSONB DEFAULT '{}',
  response_time_ms INTEGER,
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.protheus_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own protheus logs" 
ON public.protheus_usage_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create protheus logs" 
ON public.protheus_usage_logs 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_protheus_usage_logs_user_id ON public.protheus_usage_logs(user_id);
CREATE INDEX idx_protheus_usage_logs_executed_at ON public.protheus_usage_logs(executed_at DESC);
CREATE INDEX idx_protheus_usage_logs_config_id ON public.protheus_usage_logs(config_id);