-- Fix doc_chunks table schema to match processing function requirements

-- Add missing columns
ALTER TABLE public.doc_chunks ADD COLUMN IF NOT EXISTS lang text;
ALTER TABLE public.doc_chunks ADD COLUMN IF NOT EXISTS tokens integer;

-- Fix embedding dimension from 1536 to 3072
-- First drop the existing index if it exists
DROP INDEX IF EXISTS idx_doc_chunks_embedding;

-- Drop and recreate the embedding column with correct dimension
ALTER TABLE public.doc_chunks DROP COLUMN IF EXISTS embedding;
ALTER TABLE public.doc_chunks ADD COLUMN embedding vector(3072) NOT NULL;

-- For now, create without vector index since 3072 > 2000 dimension limit
-- We can add a basic btree index on document_id for performance
CREATE INDEX IF NOT EXISTS idx_doc_chunks_document_id ON public.doc_chunks (document_id);