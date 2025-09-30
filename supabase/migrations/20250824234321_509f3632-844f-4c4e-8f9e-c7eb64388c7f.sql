-- Create helper function to update document storage fields
CREATE OR REPLACE FUNCTION public.update_document_storage(
  doc_id uuid,
  new_storage_key text,
  new_mime_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.documents 
  SET 
    storage_key = new_storage_key,
    mime_type = new_mime_type,
    updated_at = now()
  WHERE id = doc_id;
END;
$$;