-- Dropar e recriar a função get_purchases_economic_groups com novos campos
DROP FUNCTION IF EXISTS public.get_purchases_economic_groups();

CREATE OR REPLACE FUNCTION public.get_purchases_economic_groups()
RETURNS TABLE(
  id_grupo integer, 
  code text, 
  name text, 
  member_count integer,
  assigned_buyer_cod text,
  assigned_buyer_filial text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    g.id_grupo,
    g.code,
    COALESCE(g.name, g.ai_suggested_name, 'Grupo ' || lpad(g.id_grupo::text, 6, '0')) AS name,
    COALESCE((
      SELECT COUNT(*) FROM public.purchases_economic_group_members m
      WHERE m.group_id = g.id_grupo
    ), 0)::int AS member_count,
    g.assigned_buyer_cod,
    g.assigned_buyer_filial
  FROM public.purchases_economic_groups g
  ORDER BY g.id_grupo;
END;
$function$;