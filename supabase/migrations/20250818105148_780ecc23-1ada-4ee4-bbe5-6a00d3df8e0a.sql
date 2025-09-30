-- Add product_image_url column to site_products table
ALTER TABLE public.site_products 
ADD COLUMN product_image_url TEXT;

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('site-products', 'site-products', true);

-- Create RLS policies for product images storage
CREATE POLICY "Allow authenticated users to upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'site-products' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow public read access to product images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'site-products');

CREATE POLICY "Allow users to update product images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'site-products' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to delete product images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'site-products' 
  AND auth.role() = 'authenticated'
);