
-- 1) Ajustar a listagem para incluir filial e cod
CREATE OR REPLACE FUNCTION public.get_unified_customer_groups()
RETURNS TABLE(
  id_grupo integer,
  group_id uuid,
  filial text,
  cod text,
  nome_grupo text,
  member_count integer,
  vendor_names text[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
    SELECT 
      pcg.id_grupo,
      pcg.id AS group_id,
      pcg.filial,
      pcg.cod,
      COALESCE(pcg.name, pcg.ai_suggested_name, 'Grupo ' || pcg.id_grupo::text) AS nome_grupo,
      (
        SELECT COUNT(*)::int
        FROM public.unified_accounts ua
        WHERE ua.economic_group_id = pcg.id_grupo
      ) AS member_count,
      (
        SELECT array_agg(DISTINCT sl.assigned_vendor_cod) 
          FILTER (WHERE sl.assigned_vendor_cod IS NOT NULL)
        FROM public.unified_accounts ua2
        LEFT JOIN public.sales_leads sl ON sl.id = ua2.lead_id
        WHERE ua2.economic_group_id = pcg.id_grupo
      ) AS vendor_names
    FROM public.protheus_customer_groups pcg
    ORDER BY pcg.id_grupo;
END;
$function$;

-- 2) Criar função para editar Nome, Filial e Código do grupo
CREATE OR REPLACE FUNCTION public.update_economic_group_details(
  p_id_grupo integer,
  p_nome_grupo text DEFAULT NULL,
  p_filial text DEFAULT NULL,
  p_cod text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.protheus_customer_groups
  SET
    name = COALESCE(p_nome_grupo, name),
    name_source = CASE WHEN p_nome_grupo IS NOT NULL THEN 'manual' ELSE name_source END,
    filial = COALESCE(p_filial, filial),
    cod = COALESCE(p_cod, cod),
    updated_at = now()
  WHERE id_grupo = p_id_grupo;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Grupo não encontrado');
  END IF;

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'error', 'Já existe um grupo com esta Filial e Código');
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;
