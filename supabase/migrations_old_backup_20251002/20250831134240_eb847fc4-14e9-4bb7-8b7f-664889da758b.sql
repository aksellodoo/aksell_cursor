
-- 1) Adicionar colunas para o vendedor do grupo
ALTER TABLE public.protheus_customer_groups
  ADD COLUMN IF NOT EXISTS assigned_vendor_cod text,
  ADD COLUMN IF NOT EXISTS assigned_vendor_filial text;

COMMENT ON COLUMN public.protheus_customer_groups.assigned_vendor_cod IS
  'Código do vendedor vinculado ao grupo (tabela SA3010)';

COMMENT ON COLUMN public.protheus_customer_groups.assigned_vendor_filial IS
  'Filial do vendedor vinculado ao grupo (tabela SA3010)';

-- 2) Atualizar a função que lista grupos unificados para incluir os novos campos
CREATE OR REPLACE FUNCTION public.get_unified_customer_groups()
RETURNS TABLE(
  id_grupo integer,
  group_id uuid,
  nome_grupo text,
  member_count integer,
  vendor_names text[],
  assigned_vendor_cod text,
  assigned_vendor_filial text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  return query
    select 
      pcg.id_grupo,
      pcg.id as group_id,
      coalesce(pcg.name, pcg.ai_suggested_name, 'Grupo ' || pcg.id_grupo::text) as nome_grupo,
      (
        select count(*)::int
        from public.unified_accounts ua
        where ua.economic_group_id = pcg.id_grupo
      ) as member_count,
      (
        select array_agg(distinct sl.assigned_vendor_cod) filter (where sl.assigned_vendor_cod is not null)
        from public.unified_accounts ua2
        left join public.sales_leads sl on sl.id = ua2.lead_id
        where ua2.economic_group_id = pcg.id_grupo
      ) as vendor_names,
      pcg.assigned_vendor_cod,
      pcg.assigned_vendor_filial
    from public.protheus_customer_groups pcg
    order by pcg.id_grupo;
end;
$function$;
