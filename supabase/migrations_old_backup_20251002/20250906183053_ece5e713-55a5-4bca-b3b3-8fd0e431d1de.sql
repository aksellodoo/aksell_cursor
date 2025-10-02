-- Fix the get_purchases_economic_groups_paginated function to use correct material types table
CREATE OR REPLACE FUNCTION public.get_purchases_economic_groups_paginated(
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 50,
  p_search_term text DEFAULT NULL,
  p_sort_column text DEFAULT 'name',
  p_sort_direction text DEFAULT 'ASC'
)
RETURNS TABLE(
  id_grupo integer,
  group_id uuid,
  code text,
  name text,
  ai_suggested_name text,
  name_source text,
  member_count bigint,
  buyers text[],
  material_types text[],
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  total_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_offset integer;
  v_search text;
  v_order_clause text;
  v_total_count bigint;
BEGIN
  v_offset := (p_page - 1) * p_page_size;
  v_search := COALESCE(p_search_term, '');
  
  -- Validate sort parameters
  IF p_sort_column NOT IN ('name', 'ai_suggested_name', 'code', 'member_count', 'created_at') THEN
    p_sort_column := 'name';
  END IF;
  
  IF p_sort_direction NOT IN ('ASC', 'DESC') THEN
    p_sort_direction := 'ASC';
  END IF;
  
  -- Build order clause
  v_order_clause := format('%I %s', p_sort_column, p_sort_direction);
  
  -- Get total count first
  SELECT COUNT(*)
  INTO v_total_count
  FROM public.purchases_economic_groups peg
  WHERE (v_search = '' OR 
         LOWER(COALESCE(peg.name, '')) ILIKE '%' || LOWER(v_search) || '%' OR
         LOWER(COALESCE(peg.ai_suggested_name, '')) ILIKE '%' || LOWER(v_search) || '%' OR
         LOWER(COALESCE(peg.code, '')) ILIKE '%' || LOWER(v_search) || '%');

  RETURN QUERY EXECUTE format($q$
    WITH group_members AS (
      SELECT 
        pegm.group_id,
        COUNT(*) as member_count
      FROM public.purchases_economic_group_members pegm
      GROUP BY pegm.group_id
    ),
    group_buyers AS (
      SELECT 
        pegm.group_id,
        ARRAY_AGG(DISTINCT us.assigned_buyer_cod) FILTER (WHERE us.assigned_buyer_cod IS NOT NULL) as buyers
      FROM public.purchases_economic_group_members pegm
      JOIN public.purchases_unified_suppliers us ON us.id = pegm.unified_supplier_id
      GROUP BY pegm.group_id
    ),
    group_material_types AS (
      SELECT 
        pegm.group_id,
        ARRAY_AGG(DISTINCT pmt.name) FILTER (WHERE pmt.name IS NOT NULL) as material_types
      FROM public.purchases_economic_group_members pegm
      JOIN public.purchases_unified_suppliers us ON us.id = pegm.unified_supplier_id
      LEFT JOIN public.purchases_unified_supplier_material_types pusmt ON pusmt.supplier_id = us.id
      LEFT JOIN public.purchases_material_types pmt ON pmt.id = pusmt.material_type_id
      GROUP BY pegm.group_id
    )
    SELECT 
      peg.id_grupo,
      peg.id as group_id,
      peg.code,
      peg.name,
      peg.ai_suggested_name,
      peg.name_source,
      COALESCE(gm.member_count, 0) as member_count,
      COALESCE(gb.buyers, ARRAY[]::text[]) as buyers,
      COALESCE(gmt.material_types, ARRAY[]::text[]) as material_types,
      peg.created_at,
      peg.updated_at,
      %L::bigint as total_count
    FROM public.purchases_economic_groups peg
    LEFT JOIN group_members gm ON gm.group_id = peg.id_grupo
    LEFT JOIN group_buyers gb ON gb.group_id = peg.id_grupo
    LEFT JOIN group_material_types gmt ON gmt.group_id = peg.id_grupo
    WHERE (%L = '' OR 
           LOWER(COALESCE(peg.name, '')) ILIKE '%%' || LOWER(%L) || '%%' OR
           LOWER(COALESCE(peg.ai_suggested_name, '')) ILIKE '%%' || LOWER(%L) || '%%' OR
           LOWER(COALESCE(peg.code, '')) ILIKE '%%' || LOWER(%L) || '%%')
    ORDER BY %s
    LIMIT %s OFFSET %s
  $q$, v_total_count, v_search, v_search, v_search, v_search, v_order_clause, p_page_size, v_offset);
END;
$function$;