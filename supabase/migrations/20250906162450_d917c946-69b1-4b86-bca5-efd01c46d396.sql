
-- Atualizar a função para incluir os nomes dos Tipos de Materiais dos grupos
DROP FUNCTION IF EXISTS public.get_purchases_economic_groups();

CREATE OR REPLACE FUNCTION public.get_purchases_economic_groups()
RETURNS TABLE(
  id_grupo integer, 
  code text, 
  name text, 
  member_count integer, 
  assigned_buyer_cod text, 
  assigned_buyer_filial text, 
  protheus_filial text, 
  protheus_cod text,
  member_buyer_names text[],
  group_assigned_buyer_name text,
  material_type_names text[]
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH group_data AS (
    SELECT 
      peg.id_grupo,
      peg.code,
      COALESCE(peg.name, peg.ai_suggested_name, 'Grupo ' || peg.id_grupo::text) AS name,
      peg.assigned_buyer_cod,
      peg.assigned_buyer_filial,
      peg.protheus_filial,
      peg.protheus_cod
    FROM public.purchases_economic_groups peg
  ),
  member_counts AS (
    SELECT 
      pegm.group_id,
      COUNT(*)::integer AS member_count
    FROM public.purchases_economic_group_members pegm
    GROUP BY pegm.group_id
  ),
  member_buyers AS (
    SELECT 
      pegm.group_id,
      array_agg(DISTINCT y1.y1_nome ORDER BY y1.y1_nome)
        FILTER (WHERE y1.y1_nome IS NOT NULL AND btrim(y1.y1_nome) <> '') AS buyer_names
    FROM public.purchases_economic_group_members pegm
    JOIN public.purchases_unified_suppliers pus ON pus.id = pegm.unified_supplier_id
    LEFT JOIN public.purchases_potential_suppliers pps ON pps.id = pus.potential_supplier_id
    LEFT JOIN public.protheus_sy1010_3249e97a y1 ON (
      btrim(y1.y1_cod) = COALESCE(
        nullif(btrim(pus.assigned_buyer_cod), ''),
        nullif(btrim(pps.assigned_buyer_cod), '')
      )
      AND btrim(y1.y1_filial) = COALESCE(
        nullif(btrim(pus.assigned_buyer_filial), ''),
        nullif(btrim(pps.assigned_buyer_filial), ''),
        '01'
      )
    )
    GROUP BY pegm.group_id
  ),
  group_buyers AS (
    SELECT 
      gd.id_grupo,
      y1g.y1_nome AS group_buyer_name
    FROM group_data gd
    LEFT JOIN public.protheus_sy1010_3249e97a y1g ON (
      btrim(y1g.y1_cod) = nullif(btrim(gd.assigned_buyer_cod), '')
      AND btrim(y1g.y1_filial) = COALESCE(nullif(btrim(gd.assigned_buyer_filial), ''), '01')
    )
  ),
  group_material_types AS (
    SELECT 
      egmt.group_id,
      array_agg(DISTINCT mt.name ORDER BY mt.name) AS material_type_names
    FROM public.purchases_economic_group_material_types egmt
    JOIN public.purchases_material_types mt ON mt.id = egmt.material_type_id
    GROUP BY egmt.group_id
  )
  SELECT 
    gd.id_grupo,
    gd.code,
    gd.name,
    COALESCE(mc.member_count, 0) AS member_count,
    gd.assigned_buyer_cod,
    gd.assigned_buyer_filial,
    gd.protheus_filial,
    gd.protheus_cod,
    COALESCE(mb.buyer_names, ARRAY[]::text[]) AS member_buyer_names,
    gb.group_buyer_name AS group_assigned_buyer_name,
    COALESCE(gmt.material_type_names, ARRAY[]::text[]) AS material_type_names
  FROM group_data gd
  LEFT JOIN member_counts mc ON mc.group_id = gd.id_grupo
  LEFT JOIN member_buyers mb ON mb.group_id = gd.id_grupo
  LEFT JOIN group_buyers gb ON gb.id_grupo = gd.id_grupo
  LEFT JOIN group_material_types gmt ON gmt.group_id = gd.id_grupo
  ORDER BY gd.id_grupo;
END;
$function$;
