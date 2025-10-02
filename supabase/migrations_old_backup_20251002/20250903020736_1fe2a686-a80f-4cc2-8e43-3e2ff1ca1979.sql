-- Completa a correção das funções de grupos econômicos para usar tabelas dinâmicas e vincular vendedores corretamente

-- Corrige get_unified_customer_groups para usar tabelas SA1010 dinâmicas e vincular vendedores por código e filial
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
  v_union_sa1 text;
begin
  -- Verifica se a tabela de vendedores existe
  select exists (
    select 1 from information_schema.tables 
    where table_schema = 'public'
      and table_name = 'protheus_sa3010_fc3d70f6'
  ) into v_has_vendor_table;

  -- Monta união dinâmica de todas as SA1010 (clientes)
  select string_agg(
    format(
      'select 
         a1_filial::text as a1_filial, 
         a1_cod::text    as a1_cod, 
         a1_loja::text   as a1_loja, 
         btrim(a1_vend::text) as a1_vend
       from %I', supabase_table_name
    ),
    ' union all '
  )
  into v_union_sa1
  from public.protheus_dynamic_tables
  where supabase_table_name like 'protheus_sa1010%';

  -- Caso não exista nenhuma SA1010 dinâmica ainda, usa uma união vazia
  if v_union_sa1 is null then
    v_union_sa1 := 'select 
                      null::text as a1_filial, 
                      null::text as a1_cod, 
                      null::text as a1_loja, 
                      null::text as a1_vend
                    where false';
  end if;

  return query execute format($q$
    with sa1_all as (
      %s
    ),
    groups as (
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
        btrim(sl.assigned_vendor_cod) as vendor_cod,
        coalesce(btrim(sl.assigned_vendor_filial), '01') as vendor_filial
      from members m
      join public.sales_leads sl on sl.id = m.lead_id
      where sl.assigned_vendor_cod is not null 
        and btrim(sl.assigned_vendor_cod) <> ''
    ),
    client_vendors as (
      select
        m.id_grupo,
        sa1.a1_vend as vendor_cod,
        sa1.a1_filial as vendor_filial
      from members m
      join sa1_all sa1
        on sa1.a1_filial = m.protheus_filial
       and sa1.a1_cod = m.protheus_cod
       and sa1.a1_loja = m.protheus_loja
      where sa1.a1_vend is not null 
        and btrim(sa1.a1_vend) <> ''
    ),
    all_vendor_codes as (
      select id_grupo, vendor_cod, vendor_filial from lead_vendors
      union
      select id_grupo, vendor_cod, vendor_filial from client_vendors
    ),
    vendor_names_per_group as (
      select
        av.id_grupo,
        case 
          when %L and sa3.a3_nome is not null then 
            coalesce(btrim(sa3.a3_nreduz::text), btrim(sa3.a3_nome::text))
          else av.vendor_cod
        end as vendor_name
      from all_vendor_codes av
      left join public.protheus_sa3010_fc3d70f6 sa3
        on btrim(sa3.a3_cod::text) = av.vendor_cod
       and btrim(sa3.a3_filial::text) = av.vendor_filial
      where case 
        when %L and sa3.a3_nome is not null then 
          coalesce(btrim(sa3.a3_nreduz::text), btrim(sa3.a3_nome::text))
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
    order by g.id_grupo
  $q$, v_union_sa1, v_has_vendor_table, v_has_vendor_table);
end;
$$;

-- Corrige get_customer_groups_with_id para usar a mesma lógica
create or replace function public.get_customer_groups_with_id(p_table_id uuid)
returns table (
  id_grupo integer,
  group_id uuid,
  filial text,
  cod text,
  nome_grupo text,
  nome_grupo_sugerido text,
  member_count integer,
  vendor_names text[]
)
language plpgsql
stable security definer
set search_path to 'public'
as $$
declare
  v_table text;
  v_has_vendor_table boolean := false;
  v_union_sa1 text;
begin
  select supabase_table_name into v_table
  from public.protheus_dynamic_tables
  where protheus_table_id = p_table_id
  limit 1;

  if v_table is null then
    raise exception 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  end if;

  select exists (
    select 1 from information_schema.tables 
    where table_schema = 'public'
      and table_name = 'protheus_sa3010_fc3d70f6'
  ) into v_has_vendor_table;

  -- Monta união dinâmica de todas as SA1010 (clientes)
  select string_agg(
    format(
      'select 
         a1_filial::text as a1_filial, 
         a1_cod::text    as a1_cod, 
         a1_loja::text   as a1_loja, 
         btrim(a1_vend::text) as a1_vend
       from %I', supabase_table_name
    ),
    ' union all '
  )
  into v_union_sa1
  from public.protheus_dynamic_tables
  where supabase_table_name like 'protheus_sa1010%';

  -- Caso não exista nenhuma SA1010 dinâmica ainda, usa uma união vazia
  if v_union_sa1 is null then
    v_union_sa1 := 'select 
                      null::text as a1_filial, 
                      null::text as a1_cod, 
                      null::text as a1_loja, 
                      null::text as a1_vend
                    where false';
  end if;

  return query execute format($q$
    with sa1_all as (
      %s
    )
    select 
      pcg.id_grupo,
      pcg.id as group_id,
      pcg.filial,
      pcg.cod,
      coalesce(pcg.name, pcg.ai_suggested_name, 'Grupo ' || pcg.id_grupo::text) as nome_grupo,
      pcg.nome_grupo_sugerido,
      (
        select count(*)::int
        from public.unified_accounts ua
        where ua.economic_group_id = pcg.id_grupo
      ) as member_count,
      (
        select coalesce(
          array(
            select distinct
              case 
                when %L and sa3.a3_nome is not null then 
                  coalesce(btrim(sa3.a3_nreduz::text), btrim(sa3.a3_nome::text))
                when sa1.a1_vend is not null then sa1.a1_vend
                when sl.assigned_vendor_cod is not null then sl.assigned_vendor_cod
                else null
              end
            from public.unified_accounts ua2
            left join sa1_all sa1 on (
              ua2.protheus_filial = sa1.a1_filial and
              ua2.protheus_cod = sa1.a1_cod and
              ua2.protheus_loja = sa1.a1_loja
            )
            left join public.sales_leads sl on sl.id = ua2.lead_id
            left join public.protheus_sa3010_fc3d70f6 sa3 on 
              btrim(sa3.a3_cod::text) = coalesce(btrim(sa1.a1_vend), btrim(sl.assigned_vendor_cod))
              and btrim(sa3.a3_filial::text) = coalesce(sa1.a1_filial, btrim(sl.assigned_vendor_filial), '01')
            where ua2.economic_group_id = pcg.id_grupo
              and (
                (sa1.a1_vend is not null and btrim(sa1.a1_vend) <> '') or
                (sl.assigned_vendor_cod is not null and btrim(sl.assigned_vendor_cod) <> '')
              )
            order by 1
          ),
          array[]::text[]
        )
      ) as vendor_names
    from public.protheus_customer_groups pcg
    where pcg.protheus_table_id = %L
    order by pcg.id_grupo
  $q$, v_union_sa1, v_has_vendor_table, p_table_id);
end;
$$;