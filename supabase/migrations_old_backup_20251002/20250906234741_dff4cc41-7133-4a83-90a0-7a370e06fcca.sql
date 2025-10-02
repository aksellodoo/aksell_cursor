-- Criar função para listar todos os grupos econômicos de compras para seletores
-- Esta função retorna todos os grupos sem paginação, ideal para dropdowns/selects

CREATE OR REPLACE FUNCTION public.get_all_purchases_economic_groups()
RETURNS TABLE(
  id_grupo integer,
  code text,
  name text,
  ai_suggested_name text,
  member_count integer,
  assigned_buyer_cod text,
  assigned_buyer_name text,
  created_at timestamp with time zone,
  material_types text[]
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    peg.id_grupo,
    peg.code,
    peg.name,
    peg.ai_suggested_name,
    COALESCE(member_counts.member_count, 0)::integer AS member_count,
    peg.assigned_buyer_cod,
    COALESCE(btrim(sy1.y1_nome), peg.assigned_buyer_cod) AS assigned_buyer_name,
    peg.created_at,
    COALESCE(
      ARRAY(
        SELECT DISTINCT smt.name
        FROM public.purchases_economic_group_material_types pegmt
        JOIN public.site_material_types smt ON smt.id = pegmt.material_type_id
        WHERE pegmt.group_id = peg.id_grupo
        ORDER BY smt.name
      ),
      ARRAY[]::text[]
    ) AS material_types
  FROM public.purchases_economic_groups peg
  LEFT JOIN (
    SELECT 
      group_id,
      COUNT(*) AS member_count
    FROM public.purchases_economic_group_members
    GROUP BY group_id
  ) member_counts ON member_counts.group_id = peg.id_grupo
  LEFT JOIN public.protheus_sy1010_3249e97a sy1 
    ON btrim(sy1.y1_cod) = btrim(peg.assigned_buyer_cod)
   AND btrim(sy1.y1_filial) = COALESCE(btrim(peg.assigned_buyer_filial), '01')
  ORDER BY 
    CASE WHEN peg.name IS NOT NULL THEN peg.name 
         WHEN peg.ai_suggested_name IS NOT NULL THEN peg.ai_suggested_name 
         ELSE 'Grupo ' || peg.id_grupo::text 
    END ASC;
END;
$function$;