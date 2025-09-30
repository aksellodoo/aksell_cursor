
-- Substitui get_purchases_group_members para não depender de us.display_name
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
DECLARE
  v_union_sa2 text;
BEGIN
  -- União dinâmica de todas as SA2010 (fornecedores)
  SELECT string_agg(
    format(
      'select 
         a2_filial::text as a2_filial, 
         a2_cod::text    as a2_cod, 
         a2_loja::text   as a2_loja, 
         a2_nome::text   as a2_nome, 
         a2_nreduz::text as a2_nreduz,
         a2_cgc::text    as a2_cgc
       from %I', 
       supabase_table_name
    ),
    ' union all '
  )
  INTO v_union_sa2
  FROM public.protheus_dynamic_tables
  WHERE supabase_table_name LIKE 'protheus_sa2010%';

  IF v_union_sa2 IS NULL THEN
    v_union_sa2 := 'select 
                      null::text as a2_filial, 
                      null::text as a2_cod, 
                      null::text as a2_loja, 
                      null::text as a2_nome, 
                      null::text as a2_nreduz,
                      null::text as a2_cgc
                    where false';
  END IF;

  RETURN QUERY EXECUTE format($q$
    WITH sa2_all AS (
      %s
    )
    SELECT 
      us.id AS unified_id,
      COALESCE(
        sa2.a2_nreduz,
        sa2.a2_nome,
        ps.trade_name,
        ps.legal_name,
        'Fornecedor ' || COALESCE(us.protheus_cod::text, left(us.id::text, 8))
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
    LEFT JOIN sa2_all sa2
      ON sa2.a2_filial = us.protheus_filial::text
     AND sa2.a2_cod    = us.protheus_cod::text
     AND sa2.a2_loja   = us.protheus_loja::text
    WHERE m.group_id = %L
    ORDER BY display_name
  $q$, v_union_sa2, p_id_grupo);
END;
$function$;

-- Substitui search_purchases_unified_suppliers para não depender de us.display_name/us.cnpj
-- e passar a buscar em SA2010, trade_name/legal_name, CNPJ normalizado e chaves Protheus
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
  v_union_sa2 text;
  v_term   text;
  v_digits text;
BEGIN
  v_term   := replace(replace(replace(coalesce(p_search_term,''), '\', '\\'), '%', '\%'), '_', '\_');
  v_digits := regexp_replace(coalesce(p_search_term,''), '[^0-9]', '', 'g');

  -- União dinâmica de todas as SA2010 (fornecedores)
  SELECT string_agg(
    format(
      'select 
         a2_filial::text as a2_filial, 
         a2_cod::text    as a2_cod, 
         a2_loja::text   as a2_loja, 
         a2_nome::text   as a2_nome, 
         a2_nreduz::text as a2_nreduz,
         a2_cgc::text    as a2_cgc
       from %I', 
       supabase_table_name
    ),
    ' union all '
  )
  INTO v_union_sa2
  FROM public.protheus_dynamic_tables
  WHERE supabase_table_name LIKE 'protheus_sa2010%';

  IF v_union_sa2 IS NULL THEN
    v_union_sa2 := 'select 
                      null::text as a2_filial, 
                      null::text as a2_cod, 
                      null::text as a2_loja, 
                      null::text as a2_nome, 
                      null::text as a2_nreduz,
                      null::text as a2_cgc
                    where false';
  END IF;

  RETURN QUERY EXECUTE format($q$
    WITH sa2_all AS (
      %s
    )
    SELECT
      us.id AS unified_id,
      COALESCE(
        sa2.a2_nreduz,
        sa2.a2_nome,
        ps.trade_name,
        ps.legal_name,
        'Fornecedor ' || COALESCE(us.protheus_cod::text, left(us.id::text, 8))
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
    LEFT JOIN sa2_all sa2
      ON sa2.a2_filial = us.protheus_filial::text
     AND sa2.a2_cod    = us.protheus_cod::text
     AND sa2.a2_loja   = us.protheus_loja::text
    LEFT JOIN public.purchases_economic_group_members m
      ON m.unified_supplier_id = us.id
    LEFT JOIN public.purchases_economic_groups g
      ON g.id_grupo = m.group_id
    WHERE
         COALESCE(sa2.a2_nome,'')    ILIKE %L ESCAPE '\'
      OR COALESCE(sa2.a2_nreduz,'')  ILIKE %L ESCAPE '\'
      OR COALESCE(ps.trade_name,'')  ILIKE %L ESCAPE '\'
      OR COALESCE(ps.legal_name,'')  ILIKE %L ESCAPE '\'
      OR COALESCE(us.protheus_cod,'')  ILIKE %L ESCAPE '\'
      OR COALESCE(us.protheus_loja,'') ILIKE %L ESCAPE '\'
      OR (
        length(%L) > 0 AND (
             regexp_replace(COALESCE(sa2.a2_cgc,''), '[^0-9]', '', 'g') ILIKE %L ESCAPE '\'
          OR regexp_replace(COALESCE(ps.cnpj,''),    '[^0-9]', '', 'g') ILIKE %L ESCAPE '\'
        )
      )
    ORDER BY display_name
    LIMIT 50
  $q$,
    v_union_sa2,
    '%' || v_term || '%',
    '%' || v_term || '%',
    '%' || v_term || '%',
    '%' || v_term || '%',
    '%' || v_term || '%',
    '%' || v_term || '%',
    v_digits,
    '%' || v_digits || '%',
    '%' || v_digits || '%'
  );
END;
$function$;
