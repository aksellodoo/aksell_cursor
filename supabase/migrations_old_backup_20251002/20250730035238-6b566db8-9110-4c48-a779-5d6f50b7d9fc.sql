-- Corrigir search_path da função get_all_subordinates
CREATE OR REPLACE FUNCTION public.get_all_subordinates(user_id UUID)
RETURNS TABLE(subordinate_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE subordinates AS (
    -- Base case: direct subordinates
    SELECT id
    FROM public.profiles
    WHERE supervisor_id = user_id
    
    UNION
    
    -- Recursive case: subordinates of subordinates
    SELECT p.id
    FROM public.profiles p
    INNER JOIN subordinates s ON p.supervisor_id = s.id
  )
  SELECT id FROM subordinates;
END;
$$;