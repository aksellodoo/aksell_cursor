-- Add slide_number column to doc_chunks for compatibility
ALTER TABLE public.doc_chunks 
ADD COLUMN IF NOT EXISTS slide_number integer;