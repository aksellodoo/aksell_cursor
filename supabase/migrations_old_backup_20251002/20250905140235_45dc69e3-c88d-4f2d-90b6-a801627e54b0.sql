-- Fix get_purchases_group_members function to properly get supplier names
CREATE OR REPLACE FUNCTION public.get_purchases_group_members(p_id_grupo integer)
 RETURNS TABLE(unified_id uuid, display_name text, unified_status text, protheus_filial text, protheus_cod text, protheus_loja text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    us.id AS unified_id,
    COALESCE(
      ps.commercial_name, 
      ps.legal_name, 
      us.commercial_name, 
      us.legal_name, 
      'Fornecedor ' || LEFT(us.id::text, 8)
    ) AS display_name,
    us.status::text AS unified_status,
    us.protheus_filial::text,
    us.protheus_cod::text,
    us.protheus_loja::text
  FROM public.purchases_economic_group_members m
  JOIN public.purchases_unified_suppliers us
    ON us.id = m.unified_supplier_id
  LEFT JOIN public.purchases_potential_suppliers ps
    ON ps.id = us.potential_supplier_id
  WHERE m.group_id = p_id_grupo
  ORDER BY display_name;
END;
$function$;

-- Fix search_purchases_unified_suppliers function to properly get supplier names and include unified_status
CREATE OR REPLACE FUNCTION public.search_purchases_unified_suppliers(p_search_term text)
 RETURNS TABLE(unified_id uuid, display_name text, unified_status text, protheus_filial text, protheus_cod text, protheus_loja text, current_group_id integer, current_group_name text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_term text;
BEGIN
  -- Escapar curinga/escape para ILIKE
  v_term := replace(replace(replace(coalesce(p_search_term,''), '\', '\\'), '%', '\%'), '_', '\_');

  RETURN QUERY
  SELECT
    us.id as unified_id,
    COALESCE(
      ps.commercial_name, 
      ps.legal_name, 
      us.commercial_name, 
      us.legal_name, 
      'Fornecedor ' || LEFT(us.id::text, 8)
    ) as display_name,
    us.status::text as unified_status,
    us.protheus_filial::text as protheus_filial,
    us.protheus_cod::text as protheus_cod,
    us.protheus_loja::text as protheus_loja,
    pegm.group_id as current_group_id,
    COALESCE(peg.name, peg.ai_suggested_name, 'Grupo ' || peg.id_grupo::text) as current_group_name
  FROM public.purchases_unified_suppliers us
  LEFT JOIN public.purchases_potential_suppliers ps
    ON ps.id = us.potential_supplier_id
  LEFT JOIN public.purchases_economic_group_members pegm
    ON pegm.unified_supplier_id = us.id
  LEFT JOIN public.purchases_economic_groups peg
    ON peg.id_grupo = pegm.group_id
  WHERE 
    (
      ps.commercial_name ILIKE '%' || v_term || '%' ESCAPE '\' OR
      ps.legal_name ILIKE '%' || v_term || '%' ESCAPE '\' OR
      us.commercial_name ILIKE '%' || v_term || '%' ESCAPE '\' OR
      us.legal_name ILIKE '%' || v_term || '%' ESCAPE '\' OR
      COALESCE(us.protheus_cod::text,'') ILIKE '%' || v_term || '%' ESCAPE '\' OR
      COALESCE(us.protheus_loja::text,'') ILIKE '%' || v_term || '%' ESCAPE '\'
    )
  ORDER BY display_name
  LIMIT 50;
END;
$function$;