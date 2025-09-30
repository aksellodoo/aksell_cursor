
-- Corrige get_purchases_group_members: usa os campos corretos de nome
CREATE OR REPLACE FUNCTION public.get_purchases_group_members(p_id_grupo integer)
RETURNS TABLE(
  unified_id uuid,
  display_name text,
  unified_status text,
  protheus_filial text,
  protheus_cod text,
  protheus_loja text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    us.id AS unified_id,
    COALESCE(
      us.display_name,
      ps.trade_name,
      ps.legal_name,
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

-- Corrige search_purchases_unified_suppliers: pesquisa por display_name/trade_name/legal_name e por CNPJ normalizado
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
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_term   text;
  v_digits text;
BEGIN
  -- Escapa curingas e prepara versão somente dígitos para CNPJ
  v_term   := replace(replace(replace(coalesce(p_search_term,''), '\', '\\'), '%', '\%'), '_', '\_');
  v_digits := regexp_replace(coalesce(p_search_term,''), '[^0-9]', '', 'g');

  RETURN QUERY
  SELECT
    us.id AS unified_id,
    COALESCE(
      us.display_name,
      ps.trade_name,
      ps.legal_name,
      'Fornecedor ' || LEFT(us.id::text, 8)
    ) AS display_name,
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
  LEFT JOIN public.purchases_potential_suppliers ps
    ON ps.id = us.potential_supplier_id
  LEFT JOIN public.purchases_economic_group_members m
    ON m.unified_supplier_id = us.id
  LEFT JOIN public.purchases_economic_groups g
    ON g.id_grupo = m.group_id
  WHERE 
    -- Nomes
    COALESCE(us.display_name,'') ILIKE '%' || v_term || '%' ESCAPE '\'
    OR COALESCE(ps.trade_name,'') ILIKE '%' || v_term || '%' ESCAPE '\'
    OR COALESCE(ps.legal_name,'') ILIKE '%' || v_term || '%' ESCAPE '\'
    -- CNPJ normalizado (tanto do unificado quanto do potencial)
    OR (
      v_digits <> ''
      AND (
        regexp_replace(COALESCE(us.cnpj,''), '[^0-9]', '', 'g') ILIKE '%' || v_digits || '%' ESCAPE '\'
        OR regexp_replace(COALESCE(ps.cnpj,''), '[^0-9]', '', 'g') ILIKE '%' || v_digits || '%' ESCAPE '\'
      )
    )
    -- Chaves Protheus
    OR COALESCE(us.protheus_cod,'')  ILIKE '%' || v_term || '%' ESCAPE '\'
    OR COALESCE(us.protheus_loja,'') ILIKE '%' || v_term || '%' ESCAPE '\'
  ORDER BY display_name
  LIMIT 50;
END;
$function$;
