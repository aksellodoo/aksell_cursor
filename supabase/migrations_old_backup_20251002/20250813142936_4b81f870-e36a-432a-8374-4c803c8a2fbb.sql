-- Create site_product_applications_map table to link products with applications
CREATE TABLE IF NOT EXISTS public.site_product_applications_map (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.site_products(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.site_product_applications(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  UNIQUE(product_id, application_id)
);

-- Enable RLS
ALTER TABLE public.site_product_applications_map ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view application mappings" 
ON public.site_product_applications_map 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create application mappings" 
ON public.site_product_applications_map 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete application mappings" 
ON public.site_product_applications_map 
FOR DELETE 
USING (
  auth.uid() = created_by OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'director')
  )
);

-- Create indexes for better performance
CREATE INDEX idx_site_product_applications_map_product_id ON public.site_product_applications_map(product_id);
CREATE INDEX idx_site_product_applications_map_application_id ON public.site_product_applications_map(application_id);

-- Create trigger to automatically update timestamps
CREATE OR REPLACE FUNCTION public.update_site_product_applications_map_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Add updated_at column if it doesn't exist
ALTER TABLE public.site_product_applications_map 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Create the trigger
DROP TRIGGER IF EXISTS update_site_product_applications_map_updated_at ON public.site_product_applications_map;
CREATE TRIGGER update_site_product_applications_map_updated_at
  BEFORE UPDATE ON public.site_product_applications_map
  FOR EACH ROW
  EXECUTE FUNCTION public.update_site_product_applications_map_updated_at();