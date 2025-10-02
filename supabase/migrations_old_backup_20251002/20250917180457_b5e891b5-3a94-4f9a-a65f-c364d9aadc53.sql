-- Add page_count column to documents table
ALTER TABLE public.documents 
ADD COLUMN page_count INTEGER NULL DEFAULT NULL;

-- Add comment to document the purpose of the column
COMMENT ON COLUMN public.documents.page_count IS 'Number of pages in the document, extracted during processing';