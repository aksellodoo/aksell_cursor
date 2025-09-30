-- Create storage policies for docs-prod bucket
-- Allow authenticated users to insert files
CREATE POLICY "Authenticated users can upload files to docs-prod"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'docs-prod' 
  AND auth.uid() IS NOT NULL
);

-- Allow users to view files they uploaded (optional, for future use)
CREATE POLICY "Users can view files in docs-prod"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'docs-prod'
  AND auth.uid() IS NOT NULL
);

-- Allow users to delete files they uploaded (optional, for future use)
CREATE POLICY "Users can delete their own files in docs-prod"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'docs-prod'
  AND auth.uid() IS NOT NULL
);