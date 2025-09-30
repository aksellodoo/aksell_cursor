
CREATE OR REPLACE FUNCTION public.get_unified_group_members(p_id_grupo integer)
RETURNS TABLE(
  unified_id uuid,
  display_name text,
  short_name text,
  commercial_name text,
  legal_name text,
  unified_status text,
  protheus_filial text,
  protheus_cod text,
  protheus_loja text,
  vendor_name text
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
         btrim(a1_filial::text) as a1_filial, 
         btrim(a1_cod::text)    as a1_cod, 
         btrim(a1_loja::text)   as a1_loja, 
         btrim(a1_nome::text)   as a1_nome, 
         btrim(a1_nreduz::text) as a1_nreduz,
         btrim(a1_vend::text)   as a1_vend
       from %I', supabase_table_name
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
                      null::text as a1_nome, 
                      null::text as a1_nreduz, 
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
       from %I', supabase_table_name
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
    base AS (
      SELECT
        ua.id                               AS unified_id,
        ua.status::text                     AS unified_status,
        btrim(ua.protheus_filial::text)     AS protheus_filial,
        btrim(ua.protheus_cod::text)        AS protheus_cod,
        btrim(ua.protheus_loja::text)       AS protheus_loja,
        ua.lead_id,
        sa1.a1_nome,
        sa1.a1_nreduz,
        sa1.a1_vend,
        btrim(sl.trade_name::text)          AS trade_name,
        btrim(sl.legal_name::text)          AS lead_legal_name,
        btrim(sl.assigned_vendor_cod::text) AS lead_vendor_cod,
        btrim(coalesce(sl.assigned_vendor_filial::text, '01')) AS lead_vendor_filial
      FROM public.unified_accounts ua
      LEFT JOIN sa1_all sa1
        ON sa1.a1_filial = btrim(ua.protheus_filial::text)
       AND sa1.a1_cod    = btrim(ua.protheus_cod::text)
       AND sa1.a1_loja   = btrim(ua.protheus_loja::text)
      LEFT JOIN public.sales_leads sl
        ON sl.id = ua.lead_id
      WHERE ua.economic_group_id = %L
    )
    SELECT
      b.unified_id,
      coalesce(b.a1_nreduz, b.trade_name, b.a1_nome, b.lead_legal_name, 'Cliente ' || coalesce(b.protheus_cod,'')) AS display_name,
      coalesce(b.a1_nreduz, b.trade_name, b.a1_nome, b.lead_legal_name)                                          AS short_name,
      coalesce(b.a1_nreduz, b.trade_name, b.a1_nome, b.lead_legal_name)                                          AS commercial_name,
      coalesce(nullif(b.lead_legal_name, ''), nullif(b.a1_nome, ''))                                             AS legal_name,
      b.unified_status,
      b.protheus_filial,
      b.protheus_cod,
      b.protheus_loja,
      coalesce(sa3.a3_nreduz, sa3.a3_nome, v.vendor_cod)                                                         AS vendor_name
    FROM base b
    LEFT JOIN LATERAL (
      SELECT 
        coalesce(btrim(b.a1_vend), btrim(b.lead_vendor_cod))                        AS vendor_cod,
        coalesce(btrim(b.lead_vendor_filial), btrim(b.protheus_filial), '01')       AS vendor_filial
    ) v ON TRUE
    LEFT JOIN sa3_all sa3
      ON sa3.a3_cod    = v.vendor_cod
     AND sa3.a3_filial = v.vendor_filial
    ORDER BY display_name
  $q$, v_union_sa1, v_union_sa3, p_id_grupo);
END;
$function$;
