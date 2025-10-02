-- Create unique indexes for unified accounts
CREATE UNIQUE INDEX IF NOT EXISTS unified_accounts_unique_lead
  ON public.unified_accounts(lead_id)
  WHERE lead_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unified_accounts_unique_protheus_unit
  ON public.unified_accounts(protheus_filial, protheus_cod, protheus_loja)
  WHERE protheus_filial IS NOT NULL
    AND protheus_cod IS NOT NULL
    AND protheus_loja IS NOT NULL;

-- Function to create missing unified accounts
CREATE OR REPLACE FUNCTION public.create_missing_unified_accounts()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_created_protheus int := 0;
  v_created_leads int := 0;
BEGIN
  -- 1) Create for Protheus clients that don't have unified accounts yet
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

  -- 2) Create for leads that don't have unified accounts yet
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
    'created_from_protheus', v_created_protheus,
    'created_from_leads', v_created_leads
  );
END;
$$;