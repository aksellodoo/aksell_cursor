-- Corrigir função compute_acl_hash usando sha256() nativo em vez de digest()
-- Substituir digest() que não funciona no Supabase por md5() que é nativo

DROP FUNCTION IF EXISTS public.compute_acl_hash(uuid, uuid);
DROP FUNCTION IF EXISTS public.compute_acl_hash(user_department_id uuid, user_role text);

-- Recriar função compute_acl_hash usando md5() nativo
CREATE OR REPLACE FUNCTION public.compute_acl_hash(p_department_id uuid, p_folder_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Usar md5() nativo do PostgreSQL em vez de digest() do pgcrypto
  RETURN md5(
    COALESCE(p_department_id::text, '') || '|' || COALESCE(p_folder_id::text, '')
  );
END;
$$;