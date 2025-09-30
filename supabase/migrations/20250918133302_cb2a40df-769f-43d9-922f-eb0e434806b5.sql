-- Adicionar campos para análise semântica de imagens nos chunks
ALTER TABLE doc_chunks 
ADD COLUMN IF NOT EXISTS semantic_description TEXT,
ADD COLUMN IF NOT EXISTS extracted_objects TEXT[],
ADD COLUMN IF NOT EXISTS has_image_analysis BOOLEAN DEFAULT FALSE;