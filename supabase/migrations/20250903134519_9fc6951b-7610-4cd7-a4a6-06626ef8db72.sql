-- Primeiro, remover a função existente
DROP FUNCTION IF EXISTS public.get_unified_customer_groups();

-- Recriar a função com o tipo de retorno correto
CREATE OR REPLACE FUNCTION public.get_unified_customer_groups()
RETURNS TABLE(
  id_grupo integer,
  group_id uuid,
  nome_grupo text,
  member_count integer,
  vendor_names text[],
  group_vendor_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_union_sa1 text;
  v_union_sa3 text;
BEGIN
  -- União dinâmica de todas as SA1010 (clientes)
  SELECT string_agg(
    format(
      'select 
         a1_filial::text as a1_filial, 
         a1_cod::text    as a1_cod, 
         a1_loja::text   as a1_loja, 
         btrim(a1_vend::text) as a1_vend
       from %I', 
       supabase_table_name
    ),
    ' union all '
  )
  INTO v_union_sa1
  FROM public.protheus_dynamic_tables
  WHERE supabase_table_name LIKE 'protheus_sa1010%';

  IF v_union_sa1 IS NULL THEN
    v_union_sa1 := 'select 
                      null::text as a1_filial, 
                      null::text as a1_cod, 
                      null::text as a1_loja, 
                      null::text as a1_vend
                    where false';
  END IF;

  -- União dinâmica de todas as SA3010 (vendedores)
  SELECT string_agg(
    format(
      'select 
         btrim(a3_filial::text) as a3_filial, 
         btrim(a3_cod::text)    as a3_cod, 
         btrim(a3_nreduz::text) as a3_nreduz, 
         btrim(a3_nome::text)   as a3_nome
       from %I', 
       supabase_table_name
    ),
    ' union all '
  )
  INTO v_union_sa3
  FROM public.protheus_dynamic_tables
  WHERE supabase_table_name LIKE 'protheus_sa3010%';

  IF v_union_sa3 IS NULL THEN
    v_union_sa3 := 'select 
                      null::text as a3_filial, 
                      null::text as a3_cod, 
                      null::text as a3_nreduz, 
                      null::text as a3_nome
                    where false';
  END IF;

  RETURN QUERY EXECUTE format($q$
    WITH sa1_all AS (
      %s
    ),
    sa3_all AS (
      %s
    ),
    groups AS (
      SELECT
        pcg.id_grupo,
        pcg.id AS group_id,
        coalesce(pcg.name, pcg.ai_suggested_name, 'Grupo ' || pcg.id_grupo::text) AS nome_grupo,
        -- Extrair vendor do array vendors (primeiro elemento)
        CASE 
          WHEN pcg.vendors IS NOT NULL AND array_length(pcg.vendors, 1) > 0
          THEN btrim(pcg.vendors[1]::text)
          ELSE NULL 
        END AS group_vendor_cod
      FROM public.protheus_customer_groups pcg
    ),
    members AS (
      SELECT
        ua.economic_group_id AS id_grupo,
        ua.id AS unified_id,
        ua.lead_id,
        ua.protheus_filial,
        ua.protheus_cod,
        ua.protheus_loja
      FROM public.unified_accounts ua
      WHERE ua.economic_group_id IS NOT NULL
    ),
    lead_vendors AS (
      SELECT
        m.id_grupo,
        btrim(sl.assigned_vendor_cod)                  AS vendor_cod,
        coalesce(btrim(sl.assigned_vendor_filial), '01') AS vendor_filial
      FROM members m
      JOIN public.sales_leads sl ON sl.id = m.lead_id
      WHERE sl.assigned_vendor_cod IS NOT NULL 
        AND btrim(sl.assigned_vendor_cod) <> ''
    ),
    client_vendors AS (
      SELECT
        m.id_grupo,
        sa1.a1_vend                 AS vendor_cod,
        btrim(sa1.a1_filial)        AS vendor_filial
      FROM members m
      JOIN sa1_all sa1
        ON sa1.a1_filial = m.protheus_filial
       AND sa1.a1_cod    = m.protheus_cod
       AND sa1.a1_loja   = m.protheus_loja
      WHERE sa1.a1_vend IS NOT NULL 
        AND btrim(sa1.a1_vend) <> ''
    ),
    all_vendor_codes AS (
      SELECT id_grupo, vendor_cod, vendor_filial FROM lead_vendors
      UNION
      SELECT id_grupo, vendor_cod, vendor_filial FROM client_vendors
    ),
    vendor_names_per_group AS (
      SELECT
        av.id_grupo,
        coalesce(sa3.a3_nreduz, sa3.a3_nome, av.vendor_cod) AS vendor_name
      FROM all_vendor_codes av
      LEFT JOIN sa3_all sa3
        ON sa3.a3_cod    = av.vendor_cod
       AND sa3.a3_filial = av.vendor_filial
      WHERE coalesce(coalesce(sa3.a3_nreduz, sa3.a3_nome, av.vendor_cod), '') <> ''
    ),
    group_vendor_resolved AS (
      SELECT
        g.id_grupo,
        coalesce(sa3g.a3_nreduz, sa3g.a3_nome, g.group_vendor_cod) AS group_vendor_name
      FROM groups g
      LEFT JOIN sa3_all sa3g
        ON sa3g.a3_cod = g.group_vendor_cod
       AND sa3g.a3_filial = '01'  -- Assumindo filial padrão
    )
    SELECT
      g.id_grupo,
      g.group_id,
      g.nome_grupo,
      coalesce(count(distinct m.unified_id), 0)::int AS member_count,
      coalesce(
        array(
          SELECT distinct vn.vendor_name
          FROM vendor_names_per_group vn
          WHERE vn.id_grupo = g.id_grupo
          ORDER BY vn.vendor_name
        ),
        array[]::text[]
      ) AS vendor_names,
      gvr.group_vendor_name
    FROM groups g
    LEFT JOIN members m ON m.id_grupo = g.id_grupo
    LEFT JOIN group_vendor_resolved gvr ON gvr.id_grupo = g.id_grupo
    GROUP BY g.id_grupo, g.group_id, g.nome_grupo, gvr.group_vendor_name
    ORDER BY g.id_grupo
  $q$, v_union_sa1, v_union_sa3);

END;
$function$;