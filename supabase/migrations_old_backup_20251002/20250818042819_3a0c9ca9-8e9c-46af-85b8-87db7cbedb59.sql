-- Add product_format column to site_products table
ALTER TABLE public.site_products 
ADD COLUMN product_format TEXT CHECK (product_format IN ('solid', 'liquid'));