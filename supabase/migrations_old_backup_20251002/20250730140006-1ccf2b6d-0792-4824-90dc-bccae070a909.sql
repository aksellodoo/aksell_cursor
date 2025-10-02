-- Drop existing function first
DROP FUNCTION IF EXISTS public.get_all_subordinates(uuid);

-- Criar função auxiliar para verificar se um usuário é TEST
CREATE OR REPLACE FUNCTION public.is_test_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND (
      email ILIKE '%test%' 
      OR name ILIKE '%[TEST]%'
    )
  );
$$;

-- Recriar função get_all_subordinates para excluir usuários TEST
CREATE OR REPLACE FUNCTION public.get_all_subordinates(supervisor_uuid uuid)
RETURNS TABLE(subordinate_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH RECURSIVE subordinate_tree AS (
    -- Base case: direct subordinates (excluindo usuários TEST)
    SELECT p.id as subordinate_id
    FROM public.profiles p
    WHERE p.supervisor_id = supervisor_uuid
    AND p.status = 'active'
    AND NOT public.is_test_user(p.id)
    
    UNION ALL
    
    -- Recursive case: subordinates of subordinates (excluindo usuários TEST)
    SELECT p.id as subordinate_id
    FROM public.profiles p
    INNER JOIN subordinate_tree st ON p.supervisor_id = st.subordinate_id
    WHERE p.status = 'active'
    AND NOT public.is_test_user(p.id)
  )
  SELECT DISTINCT st.subordinate_id FROM subordinate_tree st;
$$;