-- Create site_product_applications table for reusable applications
CREATE TABLE public.site_product_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mapping table for products and applications (many-to-many)
CREATE TABLE public.site_product_applications_map (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  application_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, application_id)
);

-- Enable RLS
ALTER TABLE public.site_product_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_product_applications_map ENABLE ROW LEVEL SECURITY;

-- RLS Policies for site_product_applications
CREATE POLICY "Admins/directors can manage applications" 
ON public.site_product_applications 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'director')
    AND p.status = 'active'
  )
);

CREATE POLICY "Everyone can view active applications" 
ON public.site_product_applications 
FOR SELECT 
USING (is_active = true);

-- RLS Policies for site_product_applications_map
CREATE POLICY "Admins/directors can manage application mappings" 
ON public.site_product_applications_map 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'director')
    AND p.status = 'active'
  )
);

CREATE POLICY "Everyone can view application mappings" 
ON public.site_product_applications_map 
FOR SELECT 
USING (true);

-- Add foreign key constraints
ALTER TABLE public.site_product_applications_map 
ADD CONSTRAINT fk_product_applications_product 
FOREIGN KEY (product_id) REFERENCES public.site_products(id) ON DELETE CASCADE;

ALTER TABLE public.site_product_applications_map 
ADD CONSTRAINT fk_product_applications_application 
FOREIGN KEY (application_id) REFERENCES public.site_product_applications(id) ON DELETE CASCADE;

-- Create updated_at trigger for site_product_applications
CREATE TRIGGER update_site_product_applications_updated_at
  BEFORE UPDATE ON public.site_product_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();