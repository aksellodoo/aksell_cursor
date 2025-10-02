-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create function to compute ACL hash for documents
CREATE OR REPLACE FUNCTION public.compute_acl_hash(doc_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  doc_record record;
  hash_input text;
BEGIN
  -- Get document details
  SELECT department_id, folder_id INTO doc_record
  FROM public.documents
  WHERE id = doc_id;
  
  -- Create hash input from department and folder
  hash_input := COALESCE(doc_record.department_id::text, '') || '|' || COALESCE(doc_record.folder_id::text, '');
  
  -- Return SHA256 hash
  RETURN encode(digest(hash_input, 'sha256'), 'hex');
END;
$$;

-- Create trigger function to set acl_hash automatically
CREATE OR REPLACE FUNCTION public.set_document_acl_hash()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.acl_hash := public.compute_acl_hash(NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger on documents table
DROP TRIGGER IF EXISTS trigger_set_acl_hash ON public.documents;
CREATE TRIGGER trigger_set_acl_hash
  BEFORE INSERT OR UPDATE OF department_id, folder_id
  ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_document_acl_hash();

-- Update existing documents to have acl_hash
UPDATE public.documents 
SET acl_hash = public.compute_acl_hash(id)
WHERE acl_hash IS NULL;

-- Create doc_chunks table for document processing
CREATE TABLE IF NOT EXISTS public.doc_chunks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid NOT NULL,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  section text,
  embedding vector(1536),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  acl_hash text NOT NULL,
  
  -- Foreign key constraint
  CONSTRAINT fk_doc_chunks_document 
    FOREIGN KEY (document_id) 
    REFERENCES public.documents(id) 
    ON DELETE CASCADE,
    
  -- Unique constraint for document + chunk index
  CONSTRAINT unique_document_chunk 
    UNIQUE (document_id, chunk_index)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_doc_chunks_document_id ON public.doc_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_chunks_acl_hash ON public.doc_chunks(acl_hash);
CREATE INDEX IF NOT EXISTS idx_doc_chunks_embedding ON public.doc_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Enable RLS on doc_chunks
ALTER TABLE public.doc_chunks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for doc_chunks
CREATE POLICY "Users can view chunks of documents they can access"
  ON public.doc_chunks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = doc_chunks.document_id
      AND d.acl_hash = doc_chunks.acl_hash
    )
  );

CREATE POLICY "System can insert chunks"
  ON public.doc_chunks
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update chunks"
  ON public.doc_chunks
  FOR UPDATE
  USING (true);

CREATE POLICY "System can delete chunks"
  ON public.doc_chunks
  FOR DELETE
  USING (true);