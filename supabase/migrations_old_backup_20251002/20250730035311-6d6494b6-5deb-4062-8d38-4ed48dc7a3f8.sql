-- Corrigir search_path da função check_shared_record_access
CREATE OR REPLACE FUNCTION public.check_shared_record_access(
  p_record_type TEXT,
  p_record_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  has_access BOOLEAN := FALSE;
BEGIN
  -- Verificar se existe compartilhamento ativo
  SELECT EXISTS(
    SELECT 1 
    FROM public.record_shares rs
    WHERE rs.record_type = p_record_type
      AND rs.record_id = p_record_id
      AND rs.status = 'active'
      AND (
        -- Compartilhado diretamente com o usuário
        rs.shared_with = p_user_id
        OR
        -- Compartilhado com algum superior hierárquico do usuário
        rs.shared_with IN (
          WITH RECURSIVE superiors AS (
            SELECT supervisor_id
            FROM public.profiles
            WHERE id = p_user_id AND supervisor_id IS NOT NULL
            
            UNION
            
            SELECT p.supervisor_id
            FROM public.profiles p
            INNER JOIN superiors s ON p.id = s.supervisor_id
            WHERE p.supervisor_id IS NOT NULL
          )
          SELECT supervisor_id FROM superiors WHERE supervisor_id IS NOT NULL
        )
      )
      AND (rs.expires_at IS NULL OR rs.expires_at > now())
  ) INTO has_access;
  
  RETURN has_access;
END;
$$;