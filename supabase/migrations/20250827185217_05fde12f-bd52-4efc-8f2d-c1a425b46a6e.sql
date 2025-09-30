
-- 1) Tabelas para grupos econômicos de clientes Protheus
create table if not exists public.protheus_customer_economic_groups (
  id uuid primary key default gen_random_uuid(),
  protheus_table_id uuid not null references public.protheus_dynamic_tables(protheus_table_id) on delete cascade,
  group_number integer not null,
  name text null,
  ai_suggested_name text null,
  ai_confidence numeric null,
  ai_reason text null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (protheus_table_id, group_number)
);

create index if not exists idx_pceg_table on public.protheus_customer_economic_groups(protheus_table_id);
create index if not exists idx_pceg_created_by on public.protheus_customer_economic_groups(created_by);

-- Trigger de updated_at
drop trigger if exists tg_pceg_updated_at on public.protheus_customer_economic_groups;
create trigger tg_pceg_updated_at
before update on public.protheus_customer_economic_groups
for each row execute function public.tg_set_updated_at();

-- Relação membros (clientes = par filial+cod)
create table if not exists public.protheus_customer_economic_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.protheus_customer_economic_groups(id) on delete cascade,
  protheus_table_id uuid not null,
  filial text not null,
  cod text not null,
  created_at timestamptz not null default now(),
  unique (protheus_table_id, filial, cod)
);

create index if not exists idx_pcegm_group on public.protheus_customer_economic_group_members(group_id);
create index if not exists idx_pcegm_table on public.protheus_customer_economic_group_members(protheus_table_id);
create index if not exists idx_pcegm_pair on public.protheus_customer_economic_group_members(filial, cod);

-- Gatilho para forçar que o protheus_table_id do membro corresponda ao do grupo
create or replace function public.validate_economic_group_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_table uuid;
begin
  select protheus_table_id into v_group_table
  from public.protheus_customer_economic_groups
  where id = new.group_id;

  if v_group_table is null then
    raise exception 'Grupo econômico inexistente para group_id=%', new.group_id;
  end if;

  new.protheus_table_id := v_group_table;
  return new;
end;
$$;

drop trigger if exists tg_pcegm_validate on public.protheus_customer_economic_group_members;
create trigger tg_pcegm_validate
before insert or update on public.protheus_customer_economic_group_members
for each row execute function public.validate_economic_group_member();

-- 2) RLS
alter table public.protheus_customer_economic_groups enable row level security;
alter table public.protheus_customer_economic_group_members enable row level security;

-- Leitura para usuários autenticados (seguindo padrão existente no projeto)
drop policy if exists "Economic groups selectable by authenticated users" on public.protheus_customer_economic_groups;
create policy "Economic groups selectable by authenticated users"
  on public.protheus_customer_economic_groups
  for select
  using (true);

drop policy if exists "Economic group members selectable by authenticated users" on public.protheus_customer_economic_group_members;
create policy "Economic group members selectable by authenticated users"
  on public.protheus_customer_economic_group_members
  for select
  using (true);

-- Criadores podem inserir/atualizar/deletar seus grupos
drop policy if exists "Creators can insert economic groups" on public.protheus_customer_economic_groups;
create policy "Creators can insert economic groups"
  on public.protheus_customer_economic_groups
  for insert
  with check (created_by = auth.uid());

drop policy if exists "Creators can update economic groups" on public.protheus_customer_economic_groups;
create policy "Creators can update economic groups"
  on public.protheus_customer_economic_groups
  for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

drop policy if exists "Creators can delete economic groups" on public.protheus_customer_economic_groups;
create policy "Creators can delete economic groups"
  on public.protheus_customer_economic_groups
  for delete
  using (created_by = auth.uid());

-- Admins/Diretores podem gerenciar grupos
drop policy if exists "Admins/directors can manage economic groups" on public.protheus_customer_economic_groups;
create policy "Admins/directors can manage economic groups"
  on public.protheus_customer_economic_groups
  as permissive
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','director')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','director')));

-- Para membros: permitir inserir/atualizar/deletar se o usuário for criador do grupo ou admin/diretor
drop policy if exists "Manage members if creator/admin/director (USING)" on public.protheus_customer_economic_group_members;
create policy "Manage members if creator/admin/director (USING)"
  on public.protheus_customer_economic_group_members
  for all
  using (
    exists (
      select 1
      from public.protheus_customer_economic_groups g
      join public.profiles p on p.id = auth.uid()
      where g.id = protheus_customer_economic_group_members.group_id
        and (g.created_by = auth.uid() or p.role in ('admin','director'))
    )
  )
  with check (
    exists (
      select 1
      from public.protheus_customer_economic_groups g
      join public.profiles p on p.id = auth.uid()
      where g.id = protheus_customer_economic_group_members.group_id
        and (g.created_by = auth.uid() or p.role in ('admin','director'))
    )
  );

-- 3) Funções utilitárias e RPCs

-- Cria um grupo novo e devolve id + número sequencial por protheus_table_id
create or replace function public.create_economic_group(p_table_id uuid, p_name text default null)
returns table(id uuid, group_number integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_num integer;
  v_creator uuid;
begin
  v_creator := auth.uid();
  if v_creator is null then
    raise exception 'Autenticação necessária';
  end if;

  select coalesce(max(group_number), 0) + 1
    into v_num
  from public.protheus_customer_economic_groups
  where protheus_table_id = p_table_id;

  insert into public.protheus_customer_economic_groups (protheus_table_id, group_number, name, created_by)
  values (p_table_id, v_num, nullif(btrim(p_name), ''), v_creator)
  returning id into v_id;

  return query select v_id, v_num;
end;
$$;

-- Renomeia um grupo (ou limpa nome se passar vazio)
create or replace function public.update_economic_group_name(p_group_id uuid, p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.protheus_customer_economic_groups
  set name = nullif(btrim(p_name), '')
  where id = p_group_id;
end;
$$;

-- Adiciona um cliente (filial+cod) a um grupo, removendo-o de qualquer outro grupo do mesmo p_table_id
create or replace function public.add_economic_group_member(p_group_id uuid, p_filial text, p_cod text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table_id uuid;
begin
  select protheus_table_id into v_table_id
  from public.protheus_customer_economic_groups
  where id = p_group_id;

  if v_table_id is null then
    raise exception 'Grupo econômico inválido';
  end if;

  -- Remove de qualquer outro grupo desse mesmo Protheus table
  delete from public.protheus_customer_economic_group_members
  where protheus_table_id = v_table_id
    and filial = p_filial
    and cod = p_cod;

  -- Vincula ao grupo atual
  insert into public.protheus_customer_economic_group_members (group_id, protheus_table_id, filial, cod)
  values (p_group_id, v_table_id, p_filial, p_cod);
end;
$$;

-- Remove um cliente do grupo
create or replace function public.remove_economic_group_member(p_group_id uuid, p_filial text, p_cod text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.protheus_customer_economic_group_members
  where group_id = p_group_id
    and filial = p_filial
    and cod = p_cod;
end;
$$;

-- Lista grupos com métricas (membros, unidades, vendedores) usando a tabela dinâmica (SA1010)
create or replace function public.get_customer_economic_groups(p_table_id uuid)
returns table(
  group_id uuid,
  group_number integer,
  display_name text,
  member_count integer,
  unit_count integer,
  vendors text[]
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_table text;
begin
  select supabase_table_name into v_table
  from public.protheus_dynamic_tables
  where protheus_table_id = p_table_id
  limit 1;

  if v_table is null then
    raise exception 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  end if;

  return query execute format($q$
    with m as (
      select m.group_id, m.filial, m.cod
      from public.protheus_customer_economic_group_members m
      join public.protheus_customer_economic_groups g on g.id = m.group_id
      where g.protheus_table_id = %L
    ),
    j as (
      select m.group_id,
             t.a1_filial::text as filial,
             t.a1_cod::text    as cod,
             t.a1_nome::text   as nome,
             t.a1_nreduz::text as short_name,
             t.a1_vend::text   as vend
      from m
      join %I t
        on t.a1_filial::text = m.filial
       and t.a1_cod::text    = m.cod
    )
    select
      g.id as group_id,
      g.group_number,
      coalesce(
        g.name,
        g.ai_suggested_name,
        (
          select x
          from (
            select coalesce(j.short_name, j.nome) as x
            from j
            where j.group_id = g.id
          ) s
          where x is not null
          order by length(x) asc
          limit 1
        )
      ) as display_name,
      (select count(distinct j2.filial || ':' || j2.cod) from j j2 where j2.group_id = g.id)::int as member_count,
      (select count(*) from j j3 where j3.group_id = g.id)::int as unit_count,
      coalesce(
        (select array_agg(distinct j4.vend) from j j4 where j4.group_id = g.id and j4.vend is not null),
        array[]::text[]
      ) as vendors
    from public.protheus_customer_economic_groups g
    where g.protheus_table_id = %L
    order by g.group_number asc
  $q$, p_table_id, v_table, p_table_id);
end;
$$;

-- Lista os membros (filial+cod) de um grupo com contagem de unidades e vendedores
create or replace function public.get_economic_group_members(p_group_id uuid)
returns table(
  filial text,
  cod text,
  display_name text,
  unit_count integer,
  vendors text[]
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_table_id uuid;
  v_table text;
begin
  select g.protheus_table_id into v_table_id
  from public.protheus_customer_economic_groups g
  where g.id = p_group_id;

  if v_table_id is null then
    raise exception 'Grupo não encontrado';
  end if;

  select supabase_table_name into v_table
  from public.protheus_dynamic_tables
  where protheus_table_id = v_table_id;

  if v_table is null then
    raise exception 'Tabela dinâmica não encontrada para protheus_table_id=%', v_table_id;
  end if;

  return query execute format($q$
    with m as (
      select filial, cod
      from public.protheus_customer_economic_group_members
      where group_id = %L
    ),
    j as (
      select 
        t.a1_filial::text as filial,
        t.a1_cod::text    as cod,
        t.a1_nome::text   as nome,
        t.a1_nreduz::text as short_name,
        t.a1_vend::text   as vend
      from %I t
      join m on m.filial = t.a1_filial::text and m.cod = t.a1_cod::text
    )
    select
      j.filial,
      j.cod,
      (
        select x
        from (values (j.short_name), (j.nome)) v(x)
        where x is not null
        order by length(x) asc
        limit 1
      ) as display_name,
      count(*)::int as unit_count,
      coalesce(array_agg(distinct j.vend), array[]::text[]) as vendors
    from j
    group by j.filial, j.cod, j.short_name, j.nome
    order by j.cod, j.filial
  $q$, p_group_id, v_table);
end;
$$;

-- Busca clientes (filial+cod) para vincular, indicando se já pertencem a algum grupo
create or replace function public.search_customers_for_group(p_table_id uuid, p_term text, p_limit integer default 20)
returns table(
  filial text,
  cod text,
  nome text,
  short_name text,
  current_group_id uuid,
  current_group_number integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_table text;
  v_term text := nullif(btrim(p_term), '');
begin
  select supabase_table_name into v_table
  from public.protheus_dynamic_tables
  where protheus_table_id = p_table_id;

  if v_table is null then
    raise exception 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  end if;

  return query execute format($q$
    with base as (
      select 
        t.a1_filial::text as filial,
        t.a1_cod::text    as cod,
        t.a1_nome::text   as nome,
        t.a1_nreduz::text as short_name
      from %I t
      where (%L is null)
         or (t.a1_cod::text ilike '%%' || %L || '%%'
          or t.a1_nome::text ilike '%%' || %L || '%%'
          or t.a1_nreduz::text ilike '%%' || %L || '%%')
      group by t.a1_filial::text, t.a1_cod::text, t.a1_nome::text, t.a1_nreduz::text
      limit %s
    )
    select 
      b.filial,
      b.cod,
      b.nome,
      b.short_name,
      gm.group_id as current_group_id,
      g.group_number as current_group_number
    from base b
    left join public.protheus_customer_economic_group_members gm
      on gm.protheus_table_id = %L
     and gm.filial = b.filial
     and gm.cod = b.cod
    left join public.protheus_customer_economic_groups g
      on g.id = gm.group_id
  $q$, v_table, v_term, v_term, v_term, p_limit, p_table_id);
end;
$$;

-- Semeia grupos a partir da base Filial+Código (cria grupos e inclui cada par como único membro, se ainda não estiver mapeado)
create or replace function public.seed_economic_groups_from_baseline(p_table_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table text;
  rec record;
  v_group_id uuid;
  v_created integer := 0;
  v_num integer;
  v_creator uuid := auth.uid();
begin
  if v_creator is null then
    raise exception 'Autenticação necessária';
  end if;

  select supabase_table_name into v_table
  from public.protheus_dynamic_tables
  where protheus_table_id = p_table_id;

  if v_table is null then
    raise exception 'Tabela dinâmica não encontrada para protheus_table_id=%', p_table_id;
  end if;

  for rec in execute format($q$
    select distinct t.a1_filial::text as filial, t.a1_cod::text as cod
    from %I t
    where not exists (
      select 1
      from public.protheus_customer_economic_group_members m
      where m.protheus_table_id = %L
        and m.filial = t.a1_filial::text
        and m.cod = t.a1_cod::text
    )
    order by 1,2
  $q$, v_table, p_table_id)
  loop
    -- próximo número do grupo para a tabela
    select coalesce(max(group_number), 0) + 1 into v_num
    from public.protheus_customer_economic_groups
    where protheus_table_id = p_table_id;

    insert into public.protheus_customer_economic_groups (protheus_table_id, group_number, created_by)
    values (p_table_id, v_num, v_creator)
    returning id into v_group_id;

    insert into public.protheus_customer_economic_group_members (group_id, protheus_table_id, filial, cod)
    values (v_group_id, p_table_id, rec.filial, rec.cod);

    v_created := v_created + 1;
  end loop;

  return v_created;
end;
$$;
