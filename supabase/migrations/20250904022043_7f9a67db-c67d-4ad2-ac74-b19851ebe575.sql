
CREATE OR REPLACE FUNCTION public.create_missing_unified_accounts()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_created_protheus int := 0;
  v_created_leads int := 0;
  v_linked_protheus_to_leads int := 0;
BEGIN
  -- Passo A) Vincular unidades Protheus a unificados de lead quando CNPJ coincidir
  WITH sa1 AS (
    SELECT
      a1_filial::text AS filial,
      a1_cod::text    AS cod,
      a1_loja::text   AS loja,
      a1_cgc::text    AS cnpj_raw
    FROM public.protheus_sa1010_80f17f00
    WHERE a1_cgc IS NOT NULL AND btrim(a1_cgc::text) <> ''
  ),
  matches AS (
    SELECT
      ua_lead.id AS ua_id,
      sa1.filial,
      sa1.cod,
      sa1.loja
    FROM sa1
    JOIN public.sales_leads sl
      ON regexp_replace(coalesce(sl.cnpj::text, ''), '[^0-9]', '', 'g')
       = regexp_replace(coalesce(sa1.cnpj_raw, ''), '[^0-9]', '', 'g')
    JOIN public.unified_accounts ua_lead
      ON ua_lead.lead_id = sl.id
    LEFT JOIN public.unified_accounts ua_existing
      ON ua_existing.protheus_filial = sa1.filial
     AND ua_existing.protheus_cod    = sa1.cod
     AND ua_existing.protheus_loja   = sa1.loja
    WHERE ua_existing.id IS NULL
      AND ua_lead.protheus_filial IS NULL
      AND ua_lead.protheus_cod IS NULL
      AND ua_lead.protheus_loja IS NULL
  ),
  dedup AS (
    -- se existir mais de uma unidade Protheus com o mesmo CNPJ, escolhemos a primeira para o mesmo UA
    SELECT DISTINCT ON (ua_id) ua_id, filial, cod, loja
    FROM matches
    ORDER BY ua_id, filial, cod, loja
  )
  UPDATE public.unified_accounts ua
  SET
    protheus_filial = d.filial,
    protheus_cod    = d.cod,
    protheus_loja   = d.loja,
    status          = CASE WHEN ua.status = 'lead_only' THEN 'lead_and_customer' ELSE ua.status END,
    updated_at      = now()
  FROM dedup d
  WHERE ua.id = d.ua_id;
  GET DIAGNOSTICS v_linked_protheus_to_leads = ROW_COUNT;

  -- Passo B) Criar unificados para clientes Protheus que ainda não possuem unificado
  INSERT INTO public.unified_accounts (
    status,
    protheus_filial,
    protheus_cod,
    protheus_loja,
    service_type,
    notes,
    created_by
  )
  SELECT
    'customer',
    sa1.a1_filial::text,
    sa1.a1_cod::text,
    sa1.a1_loja::text,
    'direct',
    'Criado automaticamente a partir do Protheus',
    auth.uid()
  FROM public.protheus_sa1010_80f17f00 sa1
  LEFT JOIN public.unified_accounts ua
    ON ua.protheus_filial = sa1.a1_filial::text
   AND ua.protheus_cod    = sa1.a1_cod::text
   AND ua.protheus_loja   = sa1.a1_loja::text
  WHERE ua.id IS NULL;
  GET DIAGNOSTICS v_created_protheus = ROW_COUNT;

  -- Passo C) Criar unificados para leads que ainda não possuem unificado
  INSERT INTO public.unified_accounts (
    status,
    lead_id,
    service_type,
    representative_id,
    notes,
    created_by
  )
  SELECT
    'lead_only',
    sl.id,
    CASE WHEN sl.attendance_type = 'representative' THEN 'representative' ELSE 'direct' END,
    CASE WHEN sl.attendance_type = 'representative' THEN sl.representative_id ELSE NULL END,
    'Criado automaticamente a partir do Lead',
    auth.uid()
  FROM public.sales_leads sl
  LEFT JOIN public.unified_accounts ua
    ON ua.lead_id = sl.id
  WHERE ua.id IS NULL;
  GET DIAGNOSTICS v_created_leads = ROW_COUNT;

  RETURN json_build_object(
    'created_from_protheus',        v_created_protheus,
    'created_from_leads',           v_created_leads,
    'linked_protheus_to_leads',     v_linked_protheus_to_leads
  );
END;
$$;
