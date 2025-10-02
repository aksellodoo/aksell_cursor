
-- 1) Adiciona coluna de vínculo de grupo em unified_accounts (se não existir)
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'unified_accounts'
      and column_name = 'economic_group_id'
  ) then
    alter table public.unified_accounts
      add column economic_group_id integer null;
  end if;
end$$;

-- Ajusta (se possível) a FK para garantir integridade referencial
do $$
begin
  -- Evita erro caso a constraint já exista
  if not exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'unified_accounts'
      and constraint_name = 'unified_accounts_economic_group_id_fkey'
  ) then
    alter table public.unified_accounts
      add constraint unified_accounts_economic_group_id_fkey
      foreign key (economic_group_id)
      references public.protheus_customer_groups(id_grupo)
      on delete set null;
  end if;
end$$;

-- Índice para buscas por grupo
create index if not exists idx_unified_accounts_economic_group_id
  on public.unified_accounts(economic_group_id);

--------------------------------------------------------------------------------
-- 2) Lista membros do grupo a partir de unified_accounts
--------------------------------------------------------------------------------
create or replace function public.get_unified_group_members(
  p_id_grupo integer,
  p_table_id uuid
)
returns table(
  unified_id uuid,
  display_name text,
  short_name text,
  vendor_name text,
  unified_status text,
  protheus_filial text,
  protheus_cod text,
  protheus_loja text
)
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_table text;
  v_has_vendor_table boolean := false;
begin
  -- Tabela SA1 correspondente ao table_id (para nomes de clientes Protheus)
  select supabase_table_name into v_table
  from public.protheus_dynamic_tables
  where protheus_table_id = p_table_id
  limit 1;

  -- Tabela de vendedores SA3 existe?
  select exists (
    select 1 from information_schema.tables
    where table_schema = 'public'
      and table_name = 'protheus_sa3010_fc3d70f6'
  ) into v_has_vendor_table;

  return query execute format($q$
    select
      ua.id as unified_id,
      coalesce(sa1.a1_nome::text, sl.trade_name::text, sl.legal_name::text, 'Sem nome') as display_name,
      coalesce(sa1.a1_nreduz::text, sl.legal_name::text, sl.trade_name::text) as short_name,
      case 
        when %L and sa3.a3_nome is not null then sa3.a3_nome::text
        when sa1.a1_vend is not null then sa1.a1_vend::text
        when sl.assigned_vendor_cod is not null then sl.assigned_vendor_cod::text
        else null
      end as vendor_name,
      ua.status::text as unified_status,
      ua.protheus_filial,
      ua.protheus_cod,
      ua.protheus_loja
    from public.unified_accounts ua
    left join %I sa1 on (
      ua.protheus_filial::text = sa1.a1_filial::text and
      ua.protheus_cod::text    = sa1.a1_cod::text and
      ua.protheus_loja::text   = sa1.a1_loja::text
    )
    left join public.sales_leads sl on sl.id = ua.lead_id
    %s
    where ua.economic_group_id = %L
    order by display_name
  $q$,
    v_has_vendor_table,
    v_table,
    case when v_has_vendor_table 
      then 'left join protheus_sa3010_fc3d70f6 sa3 on sa3.a3_cod::text = coalesce(sa1.a1_vend::text, sl.assigned_vendor_cod::text)'
      else ''
    end,
    p_id_grupo
  );
end;
$function$;

--------------------------------------------------------------------------------
-- 3) Pesquisa unified_accounts para adicionar a grupos
--------------------------------------------------------------------------------
create or replace function public.search_unified_accounts_for_groups(
  p_search_term text,
  p_table_id uuid
)
returns table(
  unified_id uuid,
  display_name text,
  unified_status text,
  protheus_filial text,
  protheus_cod text,
  protheus_loja text,
  current_group_id integer,
  current_group_name text,
  vendor_name text
)
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_table text;
  v_has_vendor_table boolean := false;
  v_term text;
begin
  select supabase_table_name into v_table
  from public.protheus_dynamic_tables
  where protheus_table_id = p_table_id
  limit 1;

  select exists (
    select 1 from information_schema.tables
    where table_schema = 'public'
      and table_name = 'protheus_sa3010_fc3d70f6'
  ) into v_has_vendor_table;

  -- Escapar curinga/escape
  v_term := replace(replace(replace(coalesce(p_search_term,''), '\', '\\'), '%', '\%'), '_', '\_');

  return query execute format($q$
    select
      ua.id as unified_id,
      coalesce(sa1.a1_nome::text, sl.trade_name::text, sl.legal_name::text, 'Sem nome') as display_name,
      ua.status::text as unified_status,
      ua.protheus_filial,
      ua.protheus_cod,
      ua.protheus_loja,
      ua.economic_group_id as current_group_id,
      coalesce(pcg.name, pcg.ai_suggested_name, 'Grupo ' || pcg.id_grupo::text) as current_group_name,
      case 
        when %L and sa3.a3_nome is not null then sa3.a3_nome::text
        when sa1.a1_vend is not null then sa1.a1_vend::text
        when sl.assigned_vendor_cod is not null then sl.assigned_vendor_cod::text
        else null
      end as vendor_name
    from public.unified_accounts ua
    left join public.protheus_customer_groups pcg on pcg.id_grupo = ua.economic_group_id
    left join %I sa1 on (
      ua.protheus_filial::text = sa1.a1_filial::text and
      ua.protheus_cod::text    = sa1.a1_cod::text and
      ua.protheus_loja::text   = sa1.a1_loja::text
    )
    left join public.sales_leads sl on sl.id = ua.lead_id
    %s
    where 
      (
        sa1.a1_nome::text ilike %L escape '\' or
        sa1.a1_nreduz::text ilike %L escape '\' or
        sl.trade_name::text ilike %L escape '\' or
        sl.legal_name::text ilike %L escape '\' or
        coalesce(ua.protheus_cod::text,'') ilike %L escape '\' or
        coalesce(ua.protheus_loja::text,'') ilike %L escape '\'
      )
    order by display_name
    limit 50
  $q$,
    v_has_vendor_table,
    v_table,
    case when v_has_vendor_table 
      then 'left join protheus_sa3010_fc3d70f6 sa3 on sa3.a3_cod::text = coalesce(sa1.a1_vend::text, sl.assigned_vendor_cod::text)'
      else ''
    end,
    '%' || v_term || '%',
    '%' || v_term || '%',
    '%' || v_term || '%',
    '%' || v_term || '%',
    '%' || v_term || '%',
    '%' || v_term || '%'
  );
end;
$function$;

--------------------------------------------------------------------------------
-- 4) Adiciona (ou move) unified_account para um grupo
--------------------------------------------------------------------------------
create or replace function public.add_unified_to_group(
  p_id_grupo integer,
  p_unified_id uuid
)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_old_group_id integer;
  v_old_group_remaining integer := null;
begin
  select economic_group_id into v_old_group_id
  from public.unified_accounts
  where id = p_unified_id;

  if v_old_group_id is not null and v_old_group_id <> p_id_grupo then
    -- Conta quantos permanecerão no grupo antigo (excluindo este)
    select count(*) into v_old_group_remaining
    from public.unified_accounts
    where economic_group_id = v_old_group_id
      and id <> p_unified_id;

    if v_old_group_remaining = 0 then
      delete from public.protheus_customer_groups
      where id_grupo = v_old_group_id;
    end if;
  end if;

  update public.unified_accounts
  set economic_group_id = p_id_grupo
  where id = p_unified_id;

  return json_build_object(
    'success', true,
    'old_group_deleted', coalesce(v_old_group_remaining, 1) = 0,
    'old_group_id', v_old_group_id
  );
end;
$function$;

--------------------------------------------------------------------------------
-- 5) Remove unified_account de um grupo
--------------------------------------------------------------------------------
create or replace function public.remove_unified_from_group(
  p_id_grupo integer,
  p_unified_id uuid
)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_remaining_members integer;
begin
  update public.unified_accounts
  set economic_group_id = null
  where id = p_unified_id
    and economic_group_id = p_id_grupo;

  select count(*) into v_remaining_members
  from public.unified_accounts
  where economic_group_id = p_id_grupo;

  if v_remaining_members = 0 then
    delete from public.protheus_customer_groups
    where id_grupo = p_id_grupo;

    return json_build_object(
      'success', true,
      'group_deleted', true
    );
  end if;

  return json_build_object(
    'success', true,
    'group_deleted', false
  );
end;
$function$;

--------------------------------------------------------------------------------
-- 6) Atualiza get_customer_groups_with_id para contar unified_accounts
--------------------------------------------------------------------------------
create or replace function public.get_customer_groups_with_id(
  p_table_id uuid
)
returns table(
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
stable
security definer
set search_path to 'public'
as $function$
declare
  v_table text;
  v_has_vendor_table boolean := false;
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

  return query execute format($q$
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
        select array_agg(distinct
          case 
            when %L and sa3.a3_nome is not null then sa3.a3_nome::text
            when sa1.a1_vend is not null then sa1.a1_vend::text
            when sl.assigned_vendor_cod is not null then sl.assigned_vendor_cod::text
            else null
          end
        ) filter (where
          case 
            when %L and sa3.a3_nome is not null then sa3.a3_nome is not null
            when sa1.a1_vend is not null then sa1.a1_vend is not null
            when sl.assigned_vendor_cod is not null then sl.assigned_vendor_cod is not null
            else false
          end
        )
        from public.unified_accounts ua2
        left join %I sa1 on (
          ua2.protheus_filial::text = sa1.a1_filial::text and
          ua2.protheus_cod::text    = sa1.a1_cod::text and
          ua2.protheus_loja::text   = sa1.a1_loja::text
        )
        left join public.sales_leads sl on sl.id = ua2.lead_id
        %s
        where ua2.economic_group_id = pcg.id_grupo
      ) as vendor_names
    from public.protheus_customer_groups pcg
    where pcg.protheus_table_id = %L
    order by pcg.id_grupo
  $q$,
    v_has_vendor_table,
    v_has_vendor_table,
    v_table,
    case when v_has_vendor_table 
      then 'left join protheus_sa3010_fc3d70f6 sa3 on sa3.a3_cod::text = coalesce(sa1.a1_vend::text, sl.assigned_vendor_cod::text)'
      else ''
    end,
    p_table_id
  );
end;
$function$;
