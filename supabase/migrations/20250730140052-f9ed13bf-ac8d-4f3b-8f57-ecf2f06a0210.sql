-- Drop existing function and recreate policies
DROP FUNCTION IF EXISTS public.get_all_subordinates(uuid) CASCADE;

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

-- Recriar policy para record_shares que foi dropada
CREATE POLICY "Users can view shares involving them or their team"
ON public.record_shares
FOR SELECT
USING (
  shared_by = auth.uid() 
  OR shared_with = auth.uid()
  OR shared_by IN (SELECT subordinate_id FROM public.get_all_subordinates(auth.uid()))
  OR shared_with IN (SELECT subordinate_id FROM public.get_all_subordinates(auth.uid()))
  OR auth.uid() IN (SELECT subordinate_id FROM public.get_all_subordinates(shared_with))
  OR auth.uid() IN (SELECT subordinate_id FROM public.get_all_subordinates(shared_by))
);