-- Create document versions table to store historical versions
CREATE TABLE public.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  storage_key TEXT,
  file_size INTEGER,
  mime_type TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  rag_summary TEXT,
  chunk_count INTEGER DEFAULT 0,
  UNIQUE(document_id, version_number)
);

-- Create document version chunks table to store RAG for historical versions
CREATE TABLE public.document_version_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES public.document_versions(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  section TEXT,
  chunk_type TEXT DEFAULT 'verbatim',
  embeddings vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(version_id, chunk_index, chunk_type)
);

-- Add change analysis column to existing doc_chunks table
ALTER TABLE public.doc_chunks ADD COLUMN change_analysis TEXT;

-- Add version number to documents table if not exists
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;

-- Enable RLS on new tables
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_version_chunks ENABLE ROW LEVEL SECURITY;

-- RLS policies for document_versions
CREATE POLICY "Users can view document versions they have access to"
ON public.document_versions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_versions.document_id
    AND (
      auth.uid() = d.created_by OR
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() 
        AND (p.role = ANY(ARRAY['admin', 'director']) OR p.department_id = d.department_id)
      )
    )
  )
);

CREATE POLICY "System can create document versions"
ON public.document_versions FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update document versions"
ON public.document_versions FOR UPDATE
USING (true);

-- RLS policies for document_version_chunks
CREATE POLICY "Users can view version chunks they have access to"
ON public.document_version_chunks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.document_versions dv
    JOIN public.documents d ON d.id = dv.document_id
    WHERE dv.id = document_version_chunks.version_id
    AND (
      auth.uid() = d.created_by OR
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() 
        AND (p.role = ANY(ARRAY['admin', 'director']) OR p.department_id = d.department_id)
      )
    )
  )
);

CREATE POLICY "System can manage version chunks"
ON public.document_version_chunks FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_document_versions_document_id ON public.document_versions(document_id);
CREATE INDEX idx_document_versions_version_number ON public.document_versions(document_id, version_number DESC);
CREATE INDEX idx_document_version_chunks_version_id ON public.document_version_chunks(version_id);
CREATE INDEX idx_document_version_chunks_embeddings ON public.document_version_chunks USING ivfflat (embeddings vector_cosine_ops);

-- Function to archive current document version
CREATE OR REPLACE FUNCTION public.archive_document_version(
  p_document_id UUID,
  p_created_by UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_version INTEGER;
  v_version_id UUID;
  v_doc_record RECORD;
BEGIN
  -- Get current document data
  SELECT * INTO v_doc_record
  FROM public.documents
  WHERE id = p_document_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found: %', p_document_id;
  END IF;
  
  -- Get current version number
  v_current_version := COALESCE(v_doc_record.version_number, 1);
  
  -- Create version record
  INSERT INTO public.document_versions (
    document_id,
    version_number,
    storage_key,
    file_size,
    mime_type,
    status,
    created_by,
    chunk_count
  ) VALUES (
    p_document_id,
    v_current_version,
    v_doc_record.storage_key,
    v_doc_record.file_size,
    v_doc_record.mime_type,
    v_doc_record.status,
    COALESCE(p_created_by, v_doc_record.created_by),
    (SELECT COUNT(*) FROM public.doc_chunks WHERE document_id = p_document_id)
  ) RETURNING id INTO v_version_id;
  
  -- Copy current chunks to version chunks
  INSERT INTO public.document_version_chunks (
    version_id,
    chunk_index,
    content,
    section,
    chunk_type,
    embeddings
  )
  SELECT 
    v_version_id,
    chunk_index,
    content,
    section,
    chunk_type,
    embeddings
  FROM public.doc_chunks
  WHERE document_id = p_document_id;
  
  -- Update document version number
  UPDATE public.documents
  SET version_number = v_current_version + 1
  WHERE id = p_document_id;
  
  -- Clean up old versions (keep only last 5)
  DELETE FROM public.document_versions
  WHERE document_id = p_document_id
  AND version_number <= v_current_version - 5;
  
  RETURN v_version_id;
END;
$$;