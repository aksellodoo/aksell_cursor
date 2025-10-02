-- Fix compute_acl_hash function by adding explicit text cast for digest function
CREATE OR REPLACE FUNCTION public.compute_acl_hash(
  user_department_id uuid,
  user_role text DEFAULT NULL::text
)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create ACL string and hash it with explicit text cast
  RETURN encode(
    digest(
      COALESCE(user_department_id::text, '') || '|' || COALESCE(user_role, 'user'),
      'sha256'::text
    ), 
    'hex'
  );
END;
$$;