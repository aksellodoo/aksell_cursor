
-- 1) Buscar fornecedores unificados para adicionar a grupos de compras
CREATE OR REPLACE FUNCTION public.search_purchases_unified_suppliers(p_search_term text)
RETURNS TABLE(
  unified_id uuid,
  display_name text,
  unified_status text,
  protheus_filial text,
  protheus_cod text,
  protheus_loja text,
  current_group_id integer,
  current_group_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE 
  v_term text;
BEGIN
  -- Escapar curingas para ILIKE
  v_term := replace(replace(replace(coalesce(p_search_term,''), '\', '\\'), '%', '\%'), '_', '\_');

  RETURN QUERY
  SELECT
    us.id AS unified_id,
    COALESCE(us.short_name, us.commercial_name, us.legal_name, 'Fornecedor ' || LEFT(us.id::text, 8)) AS display_name,
    us.status::text AS unified_status,
    us.protheus_filial::text,
    us.protheus_cod::text,
    us.protheus_loja::text,
    m.group_id AS current_group_id,
    CASE 
      WHEN m.group_id IS NOT NULL 
      THEN COALESCE(g.name, g.ai_suggested_name, 'Grupo ' || lpad(g.id_grupo::text, 6, '0'))
      ELSE NULL
    END AS current_group_name
  FROM public.purchases_unified_suppliers us
  LEFT JOIN public.purchases_economic_group_members m
    ON m.unified_supplier_id = us.id
  LEFT JOIN public.purchases_economic_groups g
    ON g.id_grupo = m.group_id
  WHERE 
    COALESCE(us.short_name,'')      ILIKE '%' || v_term || '%' ESCAPE '\'
    OR COALESCE(us.commercial_name,'') ILIKE '%' || v_term || '%' ESCAPE '\'
    OR COALESCE(us.legal_name,'')   ILIKE '%' || v_term || '%' ESCAPE '\'
    OR COALESCE(us.protheus_cod::text,'')  ILIKE '%' || v_term || '%' ESCAPE '\'
    OR COALESCE(us.protheus_loja::text,'') ILIKE '%' || v_term || '%' ESCAPE '\'
  ORDER BY display_name
  LIMIT 50;
END;
$function$;

-- 2) Atualizar nome do grupo de compras
CREATE OR REPLACE FUNCTION public.update_purchases_group_name(p_id_grupo integer, p_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.purchases_economic_groups
  SET name = NULLIF(btrim(p_name), '')
  WHERE id_grupo = p_id_grupo;

  RETURN FOUND;
END;
$function$;
