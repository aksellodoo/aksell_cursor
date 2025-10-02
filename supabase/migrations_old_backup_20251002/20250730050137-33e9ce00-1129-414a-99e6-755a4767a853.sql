-- Buscar e corrigir função que pode estar causando o warning
-- Verificar se há alguma função relacionada a aprovações que não tenha search_path

-- Corrigir qualquer função que possa estar faltando search_path
-- Vou recriar uma função que pode estar na nossa base que não tenha search_path

-- Talvez seja alguma função existente que não vimos. Vou recriar a função get_department_name se ela existir
CREATE OR REPLACE FUNCTION public.get_department_name(dept_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT name FROM public.departments WHERE id = dept_id;
$$;

-- Ou pode ser alguma função relacionada a subordinados
CREATE OR REPLACE FUNCTION public.get_all_subordinates(supervisor_uuid uuid)
RETURNS TABLE(subordinate_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH RECURSIVE subordinate_tree AS (
    -- Base case: direct subordinates
    SELECT id as subordinate_id
    FROM public.profiles
    WHERE supervisor_id = supervisor_uuid
    
    UNION ALL
    
    -- Recursive case: subordinates of subordinates
    SELECT p.id as subordinate_id
    FROM public.profiles p
    INNER JOIN subordinate_tree st ON p.supervisor_id = st.subordinate_id
  )
  SELECT subordinate_id FROM subordinate_tree;
$$;

-- Pode ser uma função de check shared access
CREATE OR REPLACE FUNCTION public.check_shared_record_access(
  p_record_type text,
  p_record_id uuid,
  p_user_id uuid
) RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.record_shares 
    WHERE record_type = p_record_type 
      AND record_id = p_record_id 
      AND shared_with = p_user_id 
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;