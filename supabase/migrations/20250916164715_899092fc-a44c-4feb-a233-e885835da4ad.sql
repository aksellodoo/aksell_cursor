-- Recreate missing ACL functions that are needed for document processing

-- Function to compute ACL hash for documents
CREATE OR REPLACE FUNCTION public.compute_document_acl_hash(doc_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  doc_record RECORD;
  acl_string text;
BEGIN
  -- Get document details
  SELECT 
    d.department_id,
    d.created_by,
    d.confidentiality_level,
    d.folder_id
  INTO doc_record
  FROM documents d
  WHERE d.id = doc_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Build ACL string based on document properties
  acl_string := COALESCE(doc_record.department_id::text, '') || '|' ||
                COALESCE(doc_record.created_by::text, '') || '|' ||
                COALESCE(doc_record.confidentiality_level::text, '') || '|' ||
                COALESCE(doc_record.folder_id::text, '');
  
  -- Return MD5 hash of the ACL string
  RETURN md5(acl_string);
END;
$$;

-- Function to compute generic ACL hash
CREATE OR REPLACE FUNCTION public.compute_acl_hash(department_id uuid DEFAULT NULL, user_id uuid DEFAULT NULL, confidentiality_level text DEFAULT NULL, folder_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  acl_string text;
BEGIN
  -- Build ACL string based on parameters
  acl_string := COALESCE(department_id::text, '') || '|' ||
                COALESCE(user_id::text, '') || '|' ||
                COALESCE(confidentiality_level::text, '') || '|' ||
                COALESCE(folder_id::text, '');
  
  -- Return MD5 hash of the ACL string
  RETURN md5(acl_string);
END;
$$;