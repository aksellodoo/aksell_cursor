
-- 1) Enum de status dos fornecedores unificados
do $$
begin
  if not exists (select 1 from pg_type where typname = 'unified_supplier_status') then
    create type public.unified_supplier_status as enum (
      'potential_only',
      'supplier',
      'potential_and_supplier',
      'archived'
    );
  end if;
end$$;

-- 2) Tabela principal de Fornecedores Unificados
create table if not exists public.purchases_unified_suppliers (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  status public.unified_supplier_status not null default 'potential_only',

  -- Vínculo Potencial Fornecedor
  potential_supplier_id uuid null references public.purchases_potential_suppliers(id) on delete set null,

  -- Vínculo Fornecedor Protheus (SA2010)
  protheus_filial text null,
  protheus_cod text null,
  protheus_loja text null,

  -- Grupo econômico (nome/controlado em protheus_supplier_groups)
  economic_group_id uuid null references public.protheus_supplier_groups(id) on delete set null,

  -- Campos auxiliares
  cnpj text null,

  created_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Pelo menos uma origem deve existir: Potencial OU unidade Protheus completa
  constraint purchases_unified_suppliers_has_source check (
    potential_supplier_id is not null
    or (protheus_filial is not null and protheus_cod is not null and protheus_loja is not null)
  )
);

-- Unicidade
create unique index if not exists purchases_unified_suppliers_unique_potential
  on public.purchases_unified_suppliers (potential_supplier_id)
  where potential_supplier_id is not null;

create unique index if not exists purchases_unified_suppliers_unique_protheus_unit
  on public.purchases_unified_suppliers (protheus_filial, protheus_cod, protheus_loja)
  where protheus_filial is not null;

-- Busca e relacionamento
create index if not exists purchases_unified_suppliers_display_name_idx
  on public.purchases_unified_suppliers (lower(display_name));

create index if not exists purchases_unified_suppliers_group_idx
  on public.purchases_unified_suppliers (economic_group_id);

-- Triggers utilitários
drop trigger if exists trg_purchases_unified_suppliers_updated_at on public.purchases_unified_suppliers;
create trigger trg_purchases_unified_suppliers_updated_at
before update on public.purchases_unified_suppliers
for each row execute function public.tg_set_updated_at();

drop trigger if exists trg_purchases_unified_suppliers_normalize_cnpj on public.purchases_unified_suppliers;
create trigger trg_purchases_unified_suppliers_normalize_cnpj
before insert or update on public.purchases_unified_suppliers
for each row execute function public.tg_normalize_cnpj();

-- Trigger para setar status automaticamente
create or replace function public.tg_set_unified_supplier_status()
returns trigger
language plpgsql
as $function$
begin
  if new.potential_supplier_id is not null
     and new.protheus_filial is not null
     and new.protheus_cod is not null
     and new.protheus_loja is not null then
    new.status := 'potential_and_supplier';
  elsif new.protheus_filial is not null
     and new.protheus_cod is not null
     and new.protheus_loja is not null then
    new.status := 'supplier';
  else
    new.status := 'potential_only';
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_purchases_unified_suppliers_set_status on public.purchases_unified_suppliers;
create trigger trg_purchases_unified_suppliers_set_status
before insert or update on public.purchases_unified_suppliers
for each row execute function public.tg_set_unified_supplier_status();

-- RLS
alter table public.purchases_unified_suppliers enable row level security;

drop policy if exists "Unified suppliers viewable by authenticated" on public.purchases_unified_suppliers;
create policy "Unified suppliers viewable by authenticated"
on public.purchases_unified_suppliers
for select
to authenticated
using (true);

drop policy if exists "Unified suppliers insert by creator or admins" on public.purchases_unified_suppliers;
create policy "Unified suppliers insert by creator or admins"
on public.purchases_unified_suppliers
for insert
to authenticated
with check (
  created_by = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','director'))
);

drop policy if exists "Unified suppliers update by owner or admins" on public.purchases_unified_suppliers;
create policy "Unified suppliers update by owner or admins"
on public.purchases_unified_suppliers
for update
to authenticated
using (
  created_by = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','director'))
)
with check (
  created_by = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','director'))
);

drop policy if exists "Unified suppliers delete by owner or admins" on public.purchases_unified_suppliers;
create policy "Unified suppliers delete by owner or admins"
on public.purchases_unified_suppliers
for delete
to authenticated
using (
  created_by = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','director'))
);

-- 3) Funções para vincular/remover grupo
create or replace function public.add_unified_supplier_to_group(p_group_id uuid, p_unified_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_old_group_id uuid;
  v_old_remaining integer := null;
begin
  select economic_group_id into v_old_group_id
  from public.purchases_unified_suppliers
  where id = p_unified_id;

  if v_old_group_id is not null and v_old_group_id <> p_group_id then
    select count(*) into v_old_remaining
    from public.purchases_unified_suppliers
    where economic_group_id = v_old_group_id
      and id <> p_unified_id;

    if v_old_remaining = 0 then
      delete from public.protheus_supplier_groups
      where id = v_old_group_id;
    end if;
  end if;

  update public.purchases_unified_suppliers
  set economic_group_id = p_group_id
  where id = p_unified_id;

  return json_build_object(
    'success', true,
    'old_group_deleted', coalesce(v_old_remaining, 1) = 0,
    'old_group_id', v_old_group_id
  );
end;
$function$;

create or replace function public.remove_unified_supplier_from_group(p_group_id uuid, p_unified_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_remaining integer;
begin
  update public.purchases_unified_suppliers
  set economic_group_id = null
  where id = p_unified_id
    and economic_group_id = p_group_id;

  select count(*) into v_remaining
  from public.purchases_unified_suppliers
  where economic_group_id = p_group_id;

  if v_remaining = 0 then
    delete from public.protheus_supplier_groups
    where id = p_group_id;

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

-- 4) Popular ausentes (Potenciais + SA2010)
create or replace function public.create_missing_unified_suppliers()
returns json
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_inserted_potential integer := 0;
  v_inserted_sa2010 integer := 0;
  v_union_sa2010 text;
begin
  -- União dinâmica de todas SA2010
  select string_agg(
    format(
      'select a2_filial::text as a2_filial, a2_cod::text as a2_cod, a2_loja::text as a2_loja, a2_nome::text as a2_nome, a2_nreduz::text as a2_nreduz, a2_cgc::text as a2_cgc from %I',
      supabase_table_name
    ),
    ' union all '
  )
  into v_union_sa2010
  from public.protheus_dynamic_tables
  where supabase_table_name like 'protheus_sa2010%';

  if v_union_sa2010 is null then
    v_union_sa2010 := 'select null::text as a2_filial, null::text as a2_cod, null::text as a2_loja, null::text as a2_nome, null::text as a2_nreduz, null::text as a2_cgc where false';
  end if;

  -- Insere Potenciais sem unificado
  with src as (
    select
      p.id as potential_id,
      coalesce(p.trade_name, p.legal_name, 'Fornecedor ' || left(p.id::text, 8)) as disp_name,
      p.cnpj,
      p.created_by
    from public.purchases_potential_suppliers p
    left join public.purchases_unified_suppliers u on u.potential_supplier_id = p.id
    where u.id is null
  )
  insert into public.purchases_unified_suppliers (display_name, potential_supplier_id, cnpj, created_by)
  select disp_name, potential_id, cnpj, created_by
  from src;
  get diagnostics v_inserted_potential = row_count;

  -- Insere unidades SA2010 sem unificado
  execute format($q$
    with sa as (%s),
    src as (
      select
        a2_filial, a2_cod, a2_loja,
        coalesce(a2_nreduz, a2_nome, 'Fornecedor '||a2_cod) as disp_name,
        a2_cgc as cnpj
      from sa
    )
    insert into public.purchases_unified_suppliers (display_name, protheus_filial, protheus_cod, protheus_loja, cnpj)
    select s.disp_name, s.a2_filial, s.a2_cod, s.a2_loja, s.cnpj
    from src s
    left join public.purchases_unified_suppliers u
      on u.protheus_filial = s.a2_filial and u.protheus_cod = s.a2_cod and u.protheus_loja = s.a2_loja
    where u.id is null
  $q$, v_union_sa2010);

  get diagnostics v_inserted_sa2010 = row_count;

  return json_build_object(
    'success', true,
    'inserted_potential', v_inserted_potential,
    'inserted_sa2010', v_inserted_sa2010
  );
end;
$function$;

-- 5) Busca simples (para autocomplete/pesquisa da tela)
create or replace function public.search_unified_suppliers_for_groups_simple(p_search_term text)
returns table(
  unified_id uuid,
  display_name text,
  unified_status text,
  protheus_filial text,
  protheus_cod text,
  protheus_loja text,
  current_group_id uuid,
  current_group_name text
)
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_term text;
  v_digits text;
  v_union_sa2010 text;
begin
  v_term := replace(replace(replace(coalesce(p_search_term,''), '\', '\\'), '%', '\%'), '_', '\_');
  v_digits := regexp_replace(coalesce(p_search_term,''), '[^0-9]', '', 'g');

  select string_agg(
    format(
      'select a2_filial::text as a2_filial, a2_cod::text as a2_cod, a2_loja::text as a2_loja, a2_nome::text as a2_nome, a2_nreduz::text as a2_nreduz, a2_cgc::text as a2_cgc from %I',
      supabase_table_name
    ),
    ' union all '
  )
  into v_union_sa2010
  from public.protheus_dynamic_tables
  where supabase_table_name like 'protheus_sa2010%';

  if v_union_sa2010 is null then
    v_union_sa2010 := 'select null::text as a2_filial, null::text as a2_cod, null::text as a2_loja, null::text as a2_nome, null::text as a2_nreduz, null::text as a2_cgc where false';
  end if;

  return query execute format($q$
    with sa as (%s)
    select
      u.id as unified_id,
      u.display_name,
      u.status::text as unified_status,
      u.protheus_filial,
      u.protheus_cod,
      u.protheus_loja,
      u.economic_group_id as current_group_id,
      coalesce(psg.name, psg.ai_suggested_name) as current_group_name
    from public.purchases_unified_suppliers u
    left join public.protheus_supplier_groups psg on psg.id = u.economic_group_id
    left join sa on (
      u.protheus_filial = sa.a2_filial
      and u.protheus_cod = sa.a2_cod
      and u.protheus_loja = sa.a2_loja
    )
    where
      (
        u.display_name ilike %L escape '\'
        or coalesce(sa.a2_nome,'') ilike %L escape '\'
        or coalesce(sa.a2_nreduz,'') ilike %L escape '\'
        or coalesce(u.protheus_cod,'') ilike %L escape '\'
        or coalesce(u.protheus_loja,'') ilike %L escape '\'
        or (length(%L) > 0 and (
          regexp_replace(coalesce(u.cnpj,''), '[^0-9]', '', 'g') ilike %L escape '\'
          or regexp_replace(coalesce(sa.a2_cgc,''), '[^0-9]', '', 'g') ilike %L escape '\'
        ))
      )
    order by u.display_name
    limit 50
  $q$,
    v_union_sa2010,
    '%'||v_term||'%',
    '%'||v_term||'%',
    '%'||v_term||'%',
    '%'||v_term||'%',
    '%'||v_term||'%',
    v_digits,
    '%'||v_digits||'%',
    '%'||v_digits||'%'
  );
end;
$function$;

revoke all on function public.search_unified_suppliers_for_groups_simple(text) from public;
grant execute on function public.search_unified_suppliers_for_groups_simple(text) to anon, authenticated, service_role;

-- 6) Tipos de Material por Grupo (substitui “segmentos” no contexto de compras)
create table if not exists public.protheus_supplier_material_types_map (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.protheus_supplier_groups(id) on delete cascade,
  material_type public.material_supply_type not null,
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_supplier_material_types_group on public.protheus_supplier_material_types_map(group_id);

alter table public.protheus_supplier_material_types_map enable row level security;

drop policy if exists "Supplier material types viewable by authenticated" on public.protheus_supplier_material_types_map;
create policy "Supplier material types viewable by authenticated"
on public.protheus_supplier_material_types_map
for select
to authenticated
using (true);

drop policy if exists "Supplier material types insert by owner or admins" on public.protheus_supplier_material_types_map;
create policy "Supplier material types insert by owner or admins"
on public.protheus_supplier_material_types_map
for insert
to authenticated
with check (
  created_by = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','director'))
);

drop policy if exists "Supplier material types delete by owner or admins" on public.protheus_supplier_material_types_map;
create policy "Supplier material types delete by owner or admins"
on public.protheus_supplier_material_types_map
for delete
to authenticated
using (
  created_by = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','director'))
);
