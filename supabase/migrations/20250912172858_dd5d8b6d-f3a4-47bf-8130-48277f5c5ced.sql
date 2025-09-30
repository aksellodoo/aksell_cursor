-- Adicionar colunas faltantes na tabela documents
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS processed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS chunk_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS error_message text;

-- Adicionar coluna para tipo de embedding na tabela doc_chunks
ALTER TABLE public.doc_chunks 
ADD COLUMN IF NOT EXISTS embedding_type text DEFAULT 'semantic',
ADD COLUMN IF NOT EXISTS extraction_source text DEFAULT 'pdf_js';

-- Criar índice para melhorar performance das buscas por tipo
CREATE INDEX IF NOT EXISTS idx_doc_chunks_embedding_type ON public.doc_chunks(embedding_type);
CREATE INDEX IF NOT EXISTS idx_doc_chunks_extraction_source ON public.doc_chunks(extraction_source);