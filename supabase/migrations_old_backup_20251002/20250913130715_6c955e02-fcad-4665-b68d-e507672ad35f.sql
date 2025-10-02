-- Fix search_documents_by_type function by removing non-existent f.acl_hash reference
CREATE OR REPLACE FUNCTION public.search_documents_by_type(
  query_embedding vector, 
  p_embedding_type text, 
  acl_hash text, 
  department_id uuid DEFAULT NULL::uuid, 
  folder_statuses text[] DEFAULT ARRAY['active'::text], 
  result_limit integer DEFAULT 32
)
RETURNS TABLE(
  document_id uuid, 
  filename text, 
  folder_id uuid, 
  chunk_index integer, 
  content text, 
  section text, 
  distance double precision, 
  embedding_type text, 
  extraction_source text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dc.document_id,
    d.name as filename,
    d.folder_id,
    dc.chunk_index,
    dc.content,
    dc.section,
    (dc.embedding <=> query_embedding) as distance,
    dc.embedding_type,
    dc.extraction_source
  FROM doc_chunks dc
  JOIN documents d ON d.id = dc.document_id
  JOIN folders f ON f.id = d.folder_id
  WHERE 
    dc.embedding_type = p_embedding_type
    AND d.status IN ('active', 'Aprovado')  -- Allow both 'active' and 'Aprovado' status
    AND f.status = ANY(folder_statuses)
    -- Removed f.acl_hash reference since the column doesn't exist
    AND (search_documents_by_type.department_id IS NULL OR d.department_id = search_documents_by_type.department_id)
  ORDER BY dc.embedding <=> query_embedding
  LIMIT result_limit;
END;
$$;