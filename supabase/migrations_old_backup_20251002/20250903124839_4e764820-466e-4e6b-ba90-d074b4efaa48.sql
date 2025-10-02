-- Atualiza a função get_unified_group_members para retornar todos os campos necessários
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
BEGIN
  RETURN QUERY
  SELECT
    ua.id as unified_id,
    coalesce(
      sl.trade_name,
      sl.legal_name,
      'Cliente ' || ua.protheus_cod
    ) as display_name,
    coalesce(sl.trade_name, 'N/A') as short_name,
    coalesce(sl.trade_name, 'N/A') as commercial_name,
    coalesce(sl.legal_name, 'N/A') as legal_name,
    ua.status::text as unified_status,
    ua.protheus_filial,
    ua.protheus_cod,
    ua.protheus_loja,
    coalesce(sl.assigned_vendor_cod, 'N/A') as vendor_name
  FROM public.unified_accounts ua
  LEFT JOIN public.sales_leads sl ON sl.id = ua.lead_id
  WHERE ua.economic_group_id = p_id_grupo;
END;
$function$;