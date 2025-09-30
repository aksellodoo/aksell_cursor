-- Add rag_status column to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS rag_status TEXT DEFAULT 'not_processed';

-- Create index for better performance on rag_status queries
CREATE INDEX IF NOT EXISTS idx_documents_rag_status ON public.documents(rag_status);

-- Remove old RAG-related columns that are no longer needed
ALTER TABLE public.documents 
DROP COLUMN IF EXISTS chunk_count,
DROP COLUMN IF EXISTS rag_capabilities,
DROP COLUMN IF EXISTS processing_status,
DROP COLUMN IF EXISTS processing_mode,
DROP COLUMN IF EXISTS processing_language_hints;

-- Update existing documents to have rag_status as 'not_processed'
UPDATE public.documents 
SET rag_status = 'not_processed' 
WHERE rag_status IS NULL;