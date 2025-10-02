-- Create RPC function to get purchases economic groups with pagination
CREATE OR REPLACE FUNCTION public.get_purchases_economic_groups_paginated(
  p_page integer DEFAULT 1,
  p_limit integer DEFAULT 50,
  p_search_term text DEFAULT NULL,
  p_sort_by text DEFAULT 'name',
  p_sort_order text DEFAULT 'ASC'
)
RETURNS TABLE(
  id_grupo integer,
  code text,
  name text,
  ai_suggested_name text,
  member_count integer,
  material_types text[],
  assigned_buyer_cod text,
  assigned_buyer_name text,
  created_at timestamp with time zone,
  total_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_offset integer;
  v_total_count bigint;
BEGIN
  v_offset := (p_page - 1) * p_limit;
  
  -- Get total count first
  SELECT COUNT(*) INTO v_total_count
  FROM public.purchases_economic_groups peg
  WHERE (p_search_term IS NULL OR 
         LOWER(COALESCE(peg.name, peg.ai_suggested_name, '')) LIKE LOWER('%' || p_search_term || '%') OR
         LOWER(peg.code) LIKE LOWER('%' || p_search_term || '%'));

  RETURN QUERY
  WITH group_data AS (
    SELECT 
      peg.id_grupo,
      peg.code,
      peg.name,
      peg.ai_suggested_name,
      COUNT(pegm.unified_supplier_id)::integer as member_count,
      COALESCE(
        ARRAY(
          SELECT DISTINCT smt.name
          FROM public.purchases_economic_group_members pegm2
          JOIN public.purchases_unified_suppliers pus ON pus.id = pegm2.unified_supplier_id
          JOIN public.purchases_unified_supplier_material_types pusmt ON pusmt.supplier_id = pus.id
          JOIN public.site_material_types smt ON smt.id = pusmt.material_type_id
          WHERE pegm2.group_id = peg.id_grupo
          ORDER BY smt.name
        ),
        ARRAY[]::text[]
      ) as material_types,
      peg.assigned_buyer_cod,
      COALESCE(btrim(sy1.y1_nome), peg.assigned_buyer_cod) as assigned_buyer_name,
      peg.created_at
    FROM public.purchases_economic_groups peg
    LEFT JOIN public.purchases_economic_group_members pegm ON pegm.group_id = peg.id_grupo
    LEFT JOIN public.protheus_sy1010_3249e97a sy1 
      ON btrim(sy1.y1_cod) = peg.assigned_buyer_cod
     AND btrim(sy1.y1_filial) = COALESCE(peg.assigned_buyer_filial, '01')
    WHERE (p_search_term IS NULL OR 
           LOWER(COALESCE(peg.name, peg.ai_suggested_name, '')) LIKE LOWER('%' || p_search_term || '%') OR
           LOWER(peg.code) LIKE LOWER('%' || p_search_term || '%'))
    GROUP BY peg.id_grupo, peg.code, peg.name, peg.ai_suggested_name, 
             peg.assigned_buyer_cod, sy1.y1_nome, peg.created_at
  )
  SELECT 
    gd.id_grupo,
    gd.code,
    gd.name,
    gd.ai_suggested_name,
    gd.member_count,
    gd.material_types,
    gd.assigned_buyer_cod,
    gd.assigned_buyer_name,
    gd.created_at,
    v_total_count
  FROM group_data gd
  ORDER BY 
    CASE WHEN p_sort_by = 'name' AND p_sort_order = 'ASC' 
         THEN COALESCE(gd.name, gd.ai_suggested_name, 'Grupo ' || gd.id_grupo::text) END ASC,
    CASE WHEN p_sort_by = 'name' AND p_sort_order = 'DESC' 
         THEN COALESCE(gd.name, gd.ai_suggested_name, 'Grupo ' || gd.id_grupo::text) END DESC,
    CASE WHEN p_sort_by = 'member_count' AND p_sort_order = 'ASC' 
         THEN gd.member_count END ASC,
    CASE WHEN p_sort_by = 'member_count' AND p_sort_order = 'DESC' 
         THEN gd.member_count END DESC,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'ASC' 
         THEN gd.created_at END ASC,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'DESC' 
         THEN gd.created_at END DESC,
    gd.id_grupo ASC
  LIMIT p_limit OFFSET v_offset;
END;
$function$;