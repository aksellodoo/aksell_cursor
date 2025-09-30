
-- Pesquisa de Grupos Econômicos (Compras) por vários critérios.
-- Retorna exatamente as mesmas colunas da listagem padrão para compatibilidade.

CREATE OR REPLACE FUNCTION public.search_purchases_economic_groups(p_search text)
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
DECLARE
  v_union_sa2 text;
  v_term text := normalize_text(coalesce(p_search,''));
  v_like text := '%' || v_term || '%';
  v_digits text := regexp_replace(coalesce(p_search,''), '[^0-9]', '', 'g');
  v_uf text := upper(btrim(coalesce(p_search,'')));
BEGIN
  -- Se não houver termo, retorna a listagem completa existente
  IF coalesce(btrim(p_search),'') = '' THEN
    RETURN QUERY SELECT * FROM public.get_purchases_economic_groups();
    RETURN;
  END IF;

  -- União dinâmica de SA2010 para dados dos fornecedores (nomes, CNPJ, cidade/UF)
  SELECT string_agg(
    format(
      'select 
         a2_filial::text as a2_filial, 
         a2_cod::text    as a2_cod, 
         a2_loja::text   as a2_loja, 
         a2_nome::text   as a2_nome, 
         a2_nreduz::text as a2_nreduz,
         a2_cgc::text    as a2_cgc,
         a2_cod_mun::text as a2_cod_mun,
         a2_est::text     as a2_est
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
                      null::text as a2_cgc,
                      null::text as a2_cod_mun,
                      null::text as a2_est
                    where false';
  END IF;

  RETURN QUERY EXECUTE format($q$
    WITH sa2_all AS (
      %s
    ),
    group_data AS (
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
    ),
    members_info AS (
      SELECT 
        gm.group_id,
        -- Nome para filtrar: fantasia, comercial (nreduz), razão (nome)
        coalesce(pps.trade_name, sa2.a2_nreduz, sa2.a2_nome, pps.legal_name) as any_name,
        -- CNPJ normalizado
        regexp_replace(coalesce(pus.cnpj, sa2.a2_cgc, pps.cnpj), '[^0-9]', '', 'g') as cnpj_digits,
        pus.protheus_cod,
        pus.protheus_filial,
        -- Cidade/UF
        coalesce(sc_ps.name, sc_sa2.name) as city_name,
        coalesce(sc_ps.uf,   sc_sa2.uf)   as city_uf,
        -- Compradores
        coalesce(nullif(btrim(pus.assigned_buyer_cod), ''), nullif(btrim(pps.assigned_buyer_cod), '')) as buyer_cod,
        btrim(y1.y1_nome) as buyer_name
      FROM public.purchases_economic_group_members gm
      JOIN public.purchases_unified_suppliers pus ON pus.id = gm.unified_supplier_id
      LEFT JOIN public.purchases_potential_suppliers pps ON pps.id = pus.potential_supplier_id
      LEFT JOIN sa2_all sa2
        ON sa2.a2_filial = pus.protheus_filial::text
       AND sa2.a2_cod    = pus.protheus_cod::text
       AND sa2.a2_loja   = pus.protheus_loja::text
      LEFT JOIN public.site_cities sc_ps ON sc_ps.id = pps.city_id
      LEFT JOIN public.site_cities sc_sa2 
        ON sc_sa2.cod_munic = regexp_replace(coalesce(sa2.a2_cod_mun,''), '[^0-9]', '', 'g')
       AND sc_sa2.uf        = upper(btrim(coalesce(sa2.a2_est, '')))
      LEFT JOIN public.protheus_sy1010_3249e97a y1 
        ON btrim(y1.y1_cod) = coalesce(nullif(btrim(pus.assigned_buyer_cod), ''), nullif(btrim(pps.assigned_buyer_cod), ''))
       AND btrim(y1.y1_filial) = coalesce(nullif(btrim(pus.assigned_buyer_filial), ''), nullif(btrim(pps.assigned_buyer_filial), ''), '01')
    ),
    matches AS (
      SELECT DISTINCT gd.id_grupo
      FROM group_data gd
      LEFT JOIN group_buyers gb ON gb.id_grupo = gd.id_grupo
      LEFT JOIN members_info mi ON mi.group_id = gd.id_grupo
      WHERE 
        -- Grupo: nome/código/Protheus
        normalize_text(gd.name) LIKE %L
        OR gd.code ILIKE %L
        OR gd.protheus_cod ILIKE %L
        OR gd.protheus_filial ILIKE %L
        -- Membros: nomes (fantasia/comercial/razão)
        OR normalize_text(mi.any_name) LIKE %L
        -- Membros: CNPJ (se termo contiver dígitos)
        OR (%L <> '' AND mi.cnpj_digits = %L)
        -- Membros: Protheus (código/filial)
        OR mi.protheus_cod ILIKE %L
        OR mi.protheus_filial ILIKE %L
        -- Compradores (grupo e membros: nome e código)
        OR mi.buyer_name ILIKE %L
        OR mi.buyer_cod ILIKE %L
        OR gb.group_buyer_name ILIKE %L
        -- Cidade e UF
        OR normalize_text(mi.city_name) LIKE %L
        OR mi.city_uf ILIKE %L
        OR mi.city_uf = %L
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
    WHERE gd.id_grupo IN (SELECT id_grupo FROM matches)
    ORDER BY gd.id_grupo
  $q$,
    v_union_sa2,
    -- Literais substituídos na ordem dos %L acima:
    v_like,  -- nome do grupo normalizado
    v_like,  -- code
    v_like,  -- protheus_cod
    v_like,  -- protheus_filial
    v_like,  -- nome de membro normalizado
    v_digits, v_digits, -- check de CNPJ (não-vazio e igualdade)
    v_like,  -- membro protheus_cod
    v_like,  -- membro protheus_filial
    v_like,  -- buyer_name
    v_like,  -- buyer_cod
    v_like,  -- group_buyer_name
    v_like,  -- city_name normalizado
    v_like,  -- city_uf like
    v_uf     -- city_uf igual (para UF curta)
  );
END;
$function$;
