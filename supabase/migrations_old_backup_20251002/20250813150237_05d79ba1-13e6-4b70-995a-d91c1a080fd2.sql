-- Fix function search path for update_site_product_names_updated_at
CREATE OR REPLACE FUNCTION public.update_site_product_names_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';