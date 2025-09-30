-- Create document access logs table
CREATE TABLE public.document_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_id UUID NOT NULL,
  folder_id UUID NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  ip_address TEXT
);

-- Create user favorites table
CREATE TABLE public.user_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_id UUID NOT NULL,
  folder_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, document_id)
);

-- Enable RLS
ALTER TABLE public.document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- RLS policies for document_access_logs
CREATE POLICY "Users can view their own access logs" 
ON public.document_access_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own access logs" 
ON public.document_access_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS policies for user_favorites
CREATE POLICY "Users can view their own favorites" 
ON public.user_favorites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites" 
ON public.user_favorites 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to log document access
CREATE OR REPLACE FUNCTION public.log_document_access(
  p_document_id UUID,
  p_folder_id UUID,
  p_access_type TEXT,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.document_access_logs (
    user_id,
    document_id,
    folder_id,
    access_type,
    user_agent,
    ip_address
  ) VALUES (
    auth.uid(),
    p_document_id,
    p_folder_id,
    p_access_type,
    p_user_agent,
    p_ip_address
  );
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_document_access_logs_user_id ON public.document_access_logs(user_id);
CREATE INDEX idx_document_access_logs_document_id ON public.document_access_logs(document_id);
CREATE INDEX idx_document_access_logs_created_at ON public.document_access_logs(created_at DESC);
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX idx_user_favorites_document_id ON public.user_favorites(document_id);