-- Remove a função compute_acl_hash incorreta que causa conflito
-- Manter apenas a função que aceita (p_department_id uuid, p_folder_id uuid)

-- Primeiro, verificar qual função tem qual assinatura
-- Remover a função com argumentos (user_department_id uuid, user_role text)
DROP FUNCTION IF EXISTS public.compute_acl_hash(user_department_id uuid, user_role text);

-- Garantir que a função correta existe com a assinatura esperada
CREATE OR REPLACE FUNCTION public.compute_acl_hash(p_department_id uuid, p_folder_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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