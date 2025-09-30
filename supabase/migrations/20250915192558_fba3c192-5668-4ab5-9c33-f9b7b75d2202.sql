-- Add page_number column to doc_chunks table
ALTER TABLE public.doc_chunks ADD COLUMN page_number integer;

-- Create index for better performance when querying by page
CREATE INDEX IF NOT EXISTS idx_doc_chunks_page_number ON public.doc_chunks(page_number);

-- Create composite index for document + page queries
CREATE INDEX IF NOT EXISTS idx_doc_chunks_document_page ON public.doc_chunks(document_id, page_number);