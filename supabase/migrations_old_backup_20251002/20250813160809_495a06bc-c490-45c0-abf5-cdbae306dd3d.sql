-- Create site_product_groups table
CREATE TABLE IF NOT EXISTS public.site_product_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site_product_groups_map table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.site_product_groups_map (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  group_id UUID NOT NULL REFERENCES public.site_product_groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_product_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_product_groups_map ENABLE ROW LEVEL SECURITY;

-- RLS Policies for site_product_groups
CREATE POLICY "Users can view active product groups" 
ON public.site_product_groups 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Users can create product groups" 
ON public.site_product_groups 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update product groups" 
ON public.site_product_groups 
FOR UPDATE 
USING (auth.uid() = created_by OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role IN ('admin', 'director')
));

CREATE POLICY "Users can delete product groups" 
ON public.site_product_groups 
FOR DELETE 
USING (auth.uid() = created_by OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role IN ('admin', 'director')
));

-- RLS Policies for site_product_groups_map
CREATE POLICY "Users can view product group mappings" 
ON public.site_product_groups_map 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create product group mappings" 
ON public.site_product_groups_map 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update product group mappings" 
ON public.site_product_groups_map 
FOR UPDATE 
USING (auth.uid() = created_by OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role IN ('admin', 'director')
));

CREATE POLICY "Users can delete product group mappings" 
ON public.site_product_groups_map 
FOR DELETE 
USING (auth.uid() = created_by OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role IN ('admin', 'director')
));

-- Add updated_at triggers
CREATE TRIGGER update_site_product_groups_updated_at
BEFORE UPDATE ON public.site_product_groups
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_site_product_groups_map_updated_at
BEFORE UPDATE ON public.site_product_groups_map
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Add unique constraint to prevent duplicate mappings
ALTER TABLE public.site_product_groups_map 
ADD CONSTRAINT unique_product_group 
UNIQUE (product_id, group_id);