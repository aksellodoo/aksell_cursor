-- Create bucket for temporary PDF uploads to Google Cloud Storage if needed
-- This will be used for PDFs that need OCR processing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pdf-ocr-temp',
  'pdf-ocr-temp',
  false,
  104857600, -- 100MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the PDF OCR temp bucket
CREATE POLICY "Allow service role to manage temp OCR files"
ON storage.objects
FOR ALL
USING (bucket_id = 'pdf-ocr-temp' AND auth.role() = 'service_role');

-- Allow authenticated users to upload files for OCR processing
CREATE POLICY "Allow authenticated users to upload PDFs for OCR"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'pdf-ocr-temp' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);