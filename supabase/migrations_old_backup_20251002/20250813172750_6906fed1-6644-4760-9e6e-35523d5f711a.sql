-- Create storage bucket for molecular structure images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-molecular-images', 'product-molecular-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the bucket
CREATE POLICY "Allow authenticated users to view molecular images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-molecular-images');

CREATE POLICY "Allow authenticated users to upload molecular images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'product-molecular-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete molecular images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'product-molecular-images' AND auth.role() = 'authenticated');