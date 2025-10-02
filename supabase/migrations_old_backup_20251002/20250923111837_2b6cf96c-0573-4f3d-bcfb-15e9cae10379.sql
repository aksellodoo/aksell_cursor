-- Corrigir o chunk_count do documento IFF-Teste.docx
UPDATE documents 
SET chunk_count = (
  SELECT COUNT(*) 
  FROM doc_chunks 
  WHERE document_id = documents.id
)
WHERE id = 'cdde5a9d-d1a6-4143-92cf-3914e4dca990';

-- Criar função para corrigir automaticamente chunk_count inconsistentes
CREATE OR REPLACE FUNCTION fix_chunk_count_inconsistencies()
RETURNS TABLE(document_id uuid, old_count integer, new_count integer) AS $$
BEGIN
  RETURN QUERY
  UPDATE documents 
  SET chunk_count = actual_count
  FROM (
    SELECT 
      d.id,
      d.chunk_count as old_chunk_count,
      COALESCE(COUNT(dc.id), 0) as actual_count
    FROM documents d
    LEFT JOIN doc_chunks dc ON dc.document_id = d.id
    GROUP BY d.id, d.chunk_count
    HAVING d.chunk_count != COALESCE(COUNT(dc.id), 0)
  ) inconsistent
  WHERE documents.id = inconsistent.id
  RETURNING documents.id, inconsistent.old_chunk_count, documents.chunk_count;
END;
$$ LANGUAGE plpgsql;