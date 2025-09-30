-- Corrige a montagem de vendor_names em get_unified_customer_groups
create or replace function public.get_unified_customer_groups()
returns table (
  id_grupo integer,
  group_id uuid,
  nome_grupo text,
  member_count integer,
  vendor_names text[]
)
language plpgsql
stable security definer
set search_path to 'public'
as $$
declare
  v_has_vendor_table boolean := false;
begin
  -- Verifica se a tabela de vendedores existe
  select exists (
    select 1 from information_schema.tables 
    where table_schema = 'public'
      and table_name = 'protheus_sa3010_fc3d70f6'
  ) into v_has_vendor_table;

  return query
    with groups as (
      select
        pcg.id_grupo,
        pcg.id as group_id,
        coalesce(pcg.name, pcg.ai_suggested_name, 'Grupo ' || pcg.id_grupo::text) as nome_grupo
      from public.protheus_customer_groups pcg
    ),
    members as (
      select
        ua.economic_group_id as id_grupo,
        ua.id as unified_id,
        ua.lead_id,
        ua.protheus_filial,
        ua.protheus_cod,
        ua.protheus_loja
      from public.unified_accounts ua
      where ua.economic_group_id is not null
    ),
    lead_vendors as (
      select
        m.id_grupo,
        sl.assigned_vendor_cod as vendor_cod
      from members m
      join public.sales_leads sl on sl.id = m.lead_id
      where sl.assigned_vendor_cod is not null
    ),
    client_vendors as (
      select
        m.id_grupo,
        sa1.a1_vend as vendor_cod
      from members m
      join public.protheus_sa1010_80f17f00 sa1
        on sa1.a1_filial::text = m.protheus_filial
       and sa1.a1_cod::text = m.protheus_cod
       and sa1.a1_loja::text = m.protheus_loja
      where sa1.a1_vend is not null
    ),
    all_vendor_codes as (
      select id_grupo, vendor_cod from lead_vendors
      union
      select id_grupo, vendor_cod from client_vendors
    ),
    vendor_names_per_group as (
      select
        av.id_grupo,
        case 
          when v_has_vendor_table and sa3.a3_nome is not null then 
            coalesce(sa3.a3_nreduz::text, sa3.a3_nome::text)
          else av.vendor_cod
        end as vendor_name
      from all_vendor_codes av
      left join public.protheus_sa3010_fc3d70f6 sa3
        on sa3.a3_cod::text = av.vendor_cod
      where case 
        when v_has_vendor_table and sa3.a3_nome is not null then 
          coalesce(sa3.a3_nreduz::text, sa3.a3_nome::text)
        else av.vendor_cod
      end is not null
    )
    select
      g.id_grupo,
      g.group_id,
      g.nome_grupo,
      coalesce(count(distinct m.unified_id), 0)::int as member_count,
      coalesce(
        array(
          select distinct vn.vendor_name
          from vendor_names_per_group vn
          where vn.id_grupo = g.id_grupo
          order by vn.vendor_name
        ),
        array[]::text[]
      ) as vendor_names
    from groups g
    left join members m on m.id_grupo = g.id_grupo
    group by g.id_grupo, g.group_id, g.nome_grupo
    order by g.id_grupo;
end;
$$;