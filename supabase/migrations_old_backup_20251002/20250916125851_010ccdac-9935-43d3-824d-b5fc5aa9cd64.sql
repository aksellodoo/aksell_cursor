-- Adicionar novos campos para chunking semântico inteligente
ALTER TABLE public.doc_chunks 
ADD COLUMN structure_type text DEFAULT 'paragraph',
ADD COLUMN confidence_score numeric(3,2) DEFAULT 0.0 CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
ADD COLUMN bbox_coordinates jsonb DEFAULT NULL,
ADD COLUMN parent_structure_id uuid DEFAULT NULL,
ADD COLUMN table_metadata jsonb DEFAULT NULL;

-- Índices para melhor performance nas novas consultas
CREATE INDEX idx_doc_chunks_structure_type ON public.doc_chunks(structure_type);
CREATE INDEX idx_doc_chunks_confidence_score ON public.doc_chunks(confidence_score DESC);
CREATE INDEX idx_doc_chunks_parent_structure ON public.doc_chunks(parent_structure_id);

-- Comentários para documentação
COMMENT ON COLUMN public.doc_chunks.structure_type IS 'Tipo de estrutura: paragraph, title, table, list, section, etc.';
COMMENT ON COLUMN public.doc_chunks.confidence_score IS 'Score de confiança do chunk (0.0-1.0)';
COMMENT ON COLUMN public.doc_chunks.bbox_coordinates IS 'Coordenadas bbox quando disponível {x, y, width, height}';
COMMENT ON COLUMN public.doc_chunks.parent_structure_id IS 'ID do chunk pai para hierarquia';
COMMENT ON COLUMN public.doc_chunks.table_metadata IS 'Metadata específica para tabelas {headers, rows, csv_data}';

-- Função para calcular score de qualidade baseado em densidade de informação
CREATE OR REPLACE FUNCTION calculate_chunk_quality_score(chunk_text text)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  text_length integer;
  word_count integer;
  unique_words integer;
  avg_word_length numeric;
  quality_score numeric;
BEGIN
  -- Calcular métricas básicas
  text_length := length(chunk_text);
  word_count := array_length(string_to_array(chunk_text, ' '), 1);
  
  -- Evitar divisão por zero
  IF word_count = 0 OR text_length = 0 THEN
    RETURN 0.0;
  END IF;
  
  -- Calcular palavras únicas
  unique_words := array_length(
    array(
      SELECT DISTINCT unnest(string_to_array(lower(chunk_text), ' '))
    ), 1
  );
  
  -- Calcular comprimento médio das palavras
  avg_word_length := text_length::numeric / word_count::numeric;
  
  -- Score baseado em densidade de informação
  quality_score := LEAST(1.0, 
    (unique_words::numeric / word_count::numeric) * 0.4 +  -- Diversidade lexical
    LEAST(1.0, avg_word_length / 5.0) * 0.3 +             -- Complexidade de palavras
    LEAST(1.0, text_length::numeric / 200.0) * 0.3        -- Densidade de informação
  );
  
  RETURN ROUND(quality_score, 2);
END;
$$;