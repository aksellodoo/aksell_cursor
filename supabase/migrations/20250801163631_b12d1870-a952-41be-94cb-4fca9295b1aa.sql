-- Create protheus_config table for storing user Protheus configurations
CREATE TABLE public.protheus_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  connection_type TEXT NOT NULL DEFAULT 'aksell' CHECK (connection_type IN ('aksell', 'totvs')),
  aksell_config JSONB NOT NULL DEFAULT '{"url": "", "apiKey": ""}',
  totvs_config JSONB NOT NULL DEFAULT '{"url": "", "apiKey": ""}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.protheus_config ENABLE ROW LEVEL SECURITY;

-- Create policies for user-specific access
CREATE POLICY "Users can view their own protheus config" 
ON public.protheus_config 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own protheus config" 
ON public.protheus_config 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own protheus config" 
ON public.protheus_config 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_protheus_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_protheus_config_updated_at
BEFORE UPDATE ON public.protheus_config
FOR EACH ROW
EXECUTE FUNCTION public.update_protheus_config_updated_at();