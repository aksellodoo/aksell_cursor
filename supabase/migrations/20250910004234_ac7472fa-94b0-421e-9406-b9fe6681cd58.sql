-- Create the search_documents RPC function that is expected by the search-docs edge function
CREATE OR REPLACE FUNCTION public.search_documents(
  query_embedding vector(1536),
  acl_hash text,
  include_archived boolean DEFAULT false,
  include_hidden boolean DEFAULT false,
  max_results integer DEFAULT 20
)
RETURNS TABLE (
  document_id uuid,
  filename text,
  folder_id uuid,
  chunk_index integer,
  content text,
  section text,
  distance real
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    (dc.embedding <=> query_embedding)::real as distance
  FROM public.doc_chunks dc
  JOIN public.documents d ON d.id = dc.document_id
  WHERE 
    (include_archived OR d.status != 'archived')
    AND (include_hidden OR d.status != 'hidden')
    AND d.status != 'error'
    AND dc.embedding IS NOT NULL
  ORDER BY dc.embedding <=> query_embedding
  LIMIT max_results;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.search_documents TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_documents TO service_role;