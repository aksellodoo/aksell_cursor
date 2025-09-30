-- Add new columns to doc_chunks table for dual indexing support
ALTER TABLE public.doc_chunks 
  ADD COLUMN modality text NOT NULL DEFAULT 'text' 
    CHECK (modality IN ('text', 'ocr', 'caption', 'semantic')),
  ADD COLUMN source text,
  ADD COLUMN word_count integer;

-- Create index for efficient querying by document and modality
CREATE INDEX doc_chunks_document_modality_idx ON public.doc_chunks (document_id, modality);

-- Add comments for documentation
COMMENT ON COLUMN public.doc_chunks.modality IS 'Type of content: text (verbatim), ocr (extracted text), caption (AI description), semantic (AI summary/expansion)';
COMMENT ON COLUMN public.doc_chunks.source IS 'Source of the content: pdfjs, gcloud_vision, openai_gpt5, file, etc.';
COMMENT ON COLUMN public.doc_chunks.word_count IS 'Number of words in this chunk for analytics and optimization';