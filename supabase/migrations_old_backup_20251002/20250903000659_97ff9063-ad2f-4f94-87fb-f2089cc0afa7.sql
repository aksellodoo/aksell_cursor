
-- Corrige a montagem de vendor_names em get_unified_customer_groups
create or replace function public.get_unified_customer_groups()
returns table (
  group_id text,
  id_grupo integer,
  member_count integer,
  nome_grupo text,
  vendor_names text[]
)
language sql
as $$
with groups as (
  select
    g.group_id,
    g.id_grupo,
    coalesce(g.name, 'Grupo ' || g.id_grupo::text) as nome_grupo
  from public.protheus_customer_groups g
),
members as (
  select
    ua.economic_group_id as id_grupo,
    ua.id as unified_id,
    ua.lead_id,
    ua.protheus_filial,
    ua.protheus_cod
  from public.unified_accounts ua
  where ua.economic_group_id is not null
),
lead_vendors as (
  select
    m.id_grupo,
    sl.assigned_vendor_filial as filial,
    sl.assigned_vendor_cod as cod
  from members m
  join public.sales_leads sl on sl.id = m.lead_id
  where sl.assigned_vendor_cod is not null
),
client_vendors as (
  select
    m.id_grupo,
    sa.a1_filial as filial,
    sa.a1_vend as cod
  from members m
  join public.protheus_sa1010_80f17f00 sa
    on sa.a1_filial = m.protheus_filial
   and sa.a1_cod = m.protheus_cod
  where sa.a1_vend is not null
),
all_vendor_keys as (
  select id_grupo, filial, cod from lead_vendors
  union
  select id_grupo, filial, cod from client_vendors
),
vendor_names_per_group as (
  select
    av.id_grupo,
    coalesce(v.a3_nreduz, v.a3_nome) as vendor_name
  from all_vendor_keys av
  left join public.protheus_sa3010_fc3d70f6 v
    on v.a3_filial = av.filial
   and v.a3_cod = av.cod
)
select
  g.group_id,
  g.id_grupo,
  coalesce(count(distinct m.unified_id), 0)::int as member_count,
  g.nome_grupo,
  coalesce(
    array(
      select distinct vn.vendor_name
      from vendor_names_per_group vn
      where vn.id_grupo = g.id_grupo
        and vn.vendor_name is not null
      order by vn.vendor_name
    ),
    array[]::text[]
  ) as vendor_names
from groups g
left join members m on m.id_grupo = g.id_grupo
group by g.group_id, g.id_grupo, g.nome_grupo
order by g.id_grupo;
$$;
