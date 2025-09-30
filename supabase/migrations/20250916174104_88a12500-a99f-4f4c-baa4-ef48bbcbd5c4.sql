-- Fix function conflicts by dropping old versions and ensuring clean state
DROP FUNCTION IF EXISTS public.compute_acl_hash(text, uuid);
DROP FUNCTION IF EXISTS public.compute_acl_hash(uuid, uuid);

-- Ensure we have the correct version of compute_acl_hash
CREATE OR REPLACE FUNCTION public.compute_acl_hash(
  department_id uuid DEFAULT NULL, 
  user_id uuid DEFAULT NULL, 
  confidentiality_level text DEFAULT NULL, 
  folder_id uuid DEFAULT NULL
)
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