-- Create table for standardized product names
CREATE TABLE public.site_product_names (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_product_name UNIQUE(name)
);

-- Enable Row Level Security
ALTER TABLE public.site_product_names ENABLE ROW LEVEL SECURITY;

-- Create policies for site_product_names
CREATE POLICY "Admins/directors can view product names" 
ON public.site_product_names 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.status = 'active' 
    AND p.role IN ('admin', 'director')
  )
);

CREATE POLICY "Admins/directors can insert product names" 
ON public.site_product_names 
FOR INSERT 
WITH CHECK (
  created_by = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.status = 'active' 
    AND p.role IN ('admin', 'director')
  )
);

CREATE POLICY "Admins/directors can update product names" 
ON public.site_product_names 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.status = 'active' 
    AND p.role IN ('admin', 'director')
  )
);

CREATE POLICY "Admins/directors can delete product names" 
ON public.site_product_names 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.status = 'active' 
    AND p.role IN ('admin', 'director')
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_site_product_names_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_site_product_names_updated_at
BEFORE UPDATE ON public.site_product_names
FOR EACH ROW
EXECUTE FUNCTION public.update_site_product_names_updated_at();

-- Add name_id column to site_products table to reference the new table
ALTER TABLE public.site_products 
ADD COLUMN name_id UUID REFERENCES public.site_product_names(id);

-- Create index for better performance
CREATE INDEX idx_site_product_names_name ON public.site_product_names(name);
CREATE INDEX idx_site_product_names_active ON public.site_product_names(is_active);
CREATE INDEX idx_site_products_name_id ON public.site_products(name_id);