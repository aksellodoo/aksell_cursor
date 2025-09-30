-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop and recreate the compute_acl_hash function with proper syntax
DROP FUNCTION IF EXISTS public.compute_acl_hash(uuid);
DROP FUNCTION IF EXISTS public.compute_acl_hash(uuid, uuid);

-- Create the main compute_acl_hash function for documents
CREATE OR REPLACE FUNCTION public.compute_acl_hash(p_document_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_department_id uuid;
  v_folder_id uuid;
BEGIN
  -- Get department_id and folder_id from the document
  SELECT department_id, folder_id 
  INTO v_department_id, v_folder_id
  FROM public.documents 
  WHERE id = p_document_id;
  
  -- Return hash based on department_id and folder_id
  RETURN encode(
    digest(
      convert_to(
        COALESCE(v_department_id::text, '') || '|' || COALESCE(v_folder_id::text, ''), 
        'UTF8'
      ), 
      'sha256'
    ), 
    'hex'
  );
END;
$$;

-- Create overloaded function for compatibility with other edge functions
CREATE OR REPLACE FUNCTION public.compute_acl_hash(p_department_id uuid, p_folder_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN encode(
    digest(
      convert_to(
        COALESCE(p_department_id::text, '') || '|' || COALESCE(p_folder_id::text, ''), 
        'UTF8'
      ), 
      'sha256'
    ), 
    'hex'
  );
END;
$$;

-- Update existing documents with correct acl_hash values
UPDATE public.documents 
SET acl_hash = public.compute_acl_hash(id)
WHERE acl_hash IS NULL OR acl_hash = '';

-- Recreate the trigger
DROP TRIGGER IF EXISTS tg_update_acl_hash ON public.documents;

CREATE TRIGGER tg_update_acl_hash
  BEFORE INSERT OR UPDATE OF department_id, folder_id ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_update_acl_hash();