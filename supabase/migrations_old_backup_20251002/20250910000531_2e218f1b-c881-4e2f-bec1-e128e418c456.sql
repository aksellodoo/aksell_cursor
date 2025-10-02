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

-- Recreate the embedding index with proper vector ops
CREATE INDEX idx_doc_chunks_embedding ON public.doc_chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);