-- Create the search_documents RPC function
CREATE OR REPLACE FUNCTION public.search_documents(
  query_embedding vector(1536),
  acl_hash text,
  department_id uuid DEFAULT NULL,
  folder_statuses text[] DEFAULT ARRAY['active'],
  result_limit integer DEFAULT 12
)
RETURNS TABLE(
  document_id uuid,
  filename text,
  folder_id uuid,
  chunk_index integer,
  content text,
  section text,
  distance float
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id as document_id,
    d.name as filename,
    d.folder_id,
    dc.chunk_index,
    dc.content,
    dc.section,
    (dc.embedding <=> query_embedding) as distance
  FROM doc_chunks dc
  JOIN documents d ON d.id = dc.document_id
  LEFT JOIN folders f ON f.id = d.folder_id
  WHERE dc.acl_hash = search_documents.acl_hash
    AND d.status = 'active'
    AND (department_id IS NULL OR d.department_id = search_documents.department_id)
    AND (f.id IS NULL OR f.status = ANY(folder_statuses))
  ORDER BY dc.embedding <=> query_embedding
  LIMIT result_limit;
END;
$$;