-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop all existing compute_acl_hash functions
DROP FUNCTION IF EXISTS public.compute_acl_hash(uuid);
DROP FUNCTION IF EXISTS public.compute_acl_hash(uuid, uuid);

-- Create a single compute_acl_hash function that takes department_id and folder_id
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

-- Update the trigger function to use the new signature
CREATE OR REPLACE FUNCTION public.tg_update_acl_hash()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.acl_hash := public.compute_acl_hash(NEW.department_id, NEW.folder_id);
  RETURN NEW;
END;
$$;

-- Update existing documents with correct acl_hash values
UPDATE public.documents 
SET acl_hash = public.compute_acl_hash(department_id, folder_id)
WHERE acl_hash IS NULL OR acl_hash = '';

-- Recreate the trigger
DROP TRIGGER IF EXISTS tg_update_acl_hash ON public.documents;

CREATE TRIGGER tg_update_acl_hash
  BEFORE INSERT OR UPDATE OF department_id, folder_id ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_update_acl_hash();