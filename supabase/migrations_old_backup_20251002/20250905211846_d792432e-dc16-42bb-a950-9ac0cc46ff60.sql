
-- 1) Corrigir cálculo de status (preservar 'archived')
create or replace function public.tg_set_unified_supplier_status()
returns trigger
language plpgsql
as $$
begin
  -- Se usuário marcou 'archived', preserve
  if new.status = 'archived' then
    return new;
  end if;

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
$$;

-- 2) Criar/atualizar a RPC de "Criar faltantes" garantindo status e protheus_* nulos
create or replace function public.create_missing_unified_suppliers()
returns json
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_created int := 0;
begin
  with to_create as (
    select
      ps.id as potential_id,
      ps.cnpj,
      ps.assigned_buyer_cod,
      ps.assigned_buyer_filial
    from public.purchases_potential_suppliers ps
    left join public.purchases_unified_suppliers us
      on us.potential_supplier_id = ps.id
    where us.id is null
  ),
  inserted as (
    insert into public.purchases_unified_suppliers(
      potential_supplier_id,
      cnpj,
      attendance_type,
      assigned_buyer_cod,
      assigned_buyer_filial,
      -- forçar status inicial corretamente
      status,
      -- garantir que NUNCA preencha protheus_* aqui
      protheus_filial,
      protheus_cod,
      protheus_loja,
      created_by
    )
    select
      potential_id,
      cnpj,
      'direct',                   -- padrão
      assigned_buyer_cod,
      assigned_buyer_filial,
      'potential_only',
      null, null, null,
      auth.uid()
    from to_create
    returning 1
  )
  select count(*) into v_created from inserted;

  return json_build_object(
    'success', true,
    'created_count', coalesce(v_created,0)
  );
end;
$$;

-- 3) Sincronização bidirecional do Comprador Designado

-- 3.1 Unificado -> Potencial (quando criar/alterar no unificado)
create or replace function public.tg_sync_buyer_unified_to_potential()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.potential_supplier_id is not null then
    if tg_op = 'INSERT'
       or new.assigned_buyer_cod is distinct from coalesce(old.assigned_buyer_cod, null)
       or new.assigned_buyer_filial is distinct from coalesce(old.assigned_buyer_filial, null)
    then
      update public.purchases_potential_suppliers
         set assigned_buyer_cod = new.assigned_buyer_cod,
             assigned_buyer_filial = new.assigned_buyer_filial,
             updated_at = now()
       where id = new.potential_supplier_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_buyer_unified_to_potential on public.purchases_unified_suppliers;
create trigger trg_sync_buyer_unified_to_potential
before insert or update on public.purchases_unified_suppliers
for each row execute function public.tg_sync_buyer_unified_to_potential();

-- 3.2 Potencial -> Unificado (quando alterar no potencial)
create or replace function public.tg_sync_buyer_potential_to_unified()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.assigned_buyer_cod is distinct from old.assigned_buyer_cod
     or new.assigned_buyer_filial is distinct from old.assigned_buyer_filial
  then
    update public.purchases_unified_suppliers
       set assigned_buyer_cod = new.assigned_buyer_cod,
           assigned_buyer_filial = new.assigned_buyer_filial,
           updated_at = now()
     where potential_supplier_id = new.id;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_sync_buyer_potential_to_unified on public.purchases_potential_suppliers;
create trigger trg_sync_buyer_potential_to_unified
after update on public.purchases_potential_suppliers
for each row execute function public.tg_sync_buyer_potential_to_unified();

-- 4) Sincronização dos Tipos de Materiais

-- 4.1 Ao definir economic_group_id no unificado, copiar do potencial para o grupo
create or replace function public.tg_copy_material_types_to_group_on_group_set()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if (old.economic_group_id is null and new.economic_group_id is not null)
     and new.potential_supplier_id is not null
  then
    insert into public.purchases_supplier_group_material_types (group_id, material_type_id, created_by)
    select new.economic_group_id, psmt.material_type_id, coalesce(auth.uid(), psmt.created_by)
      from public.purchases_potential_supplier_material_types psmt
     where psmt.supplier_id = new.potential_supplier_id
       and not exists (
         select 1
           from public.purchases_supplier_group_material_types g
          where g.group_id = new.economic_group_id
            and g.material_type_id = psmt.material_type_id
       );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_copy_material_types_to_group_on_group_set on public.purchases_unified_suppliers;
create trigger trg_copy_material_types_to_group_on_group_set
after update on public.purchases_unified_suppliers
for each row execute function public.tg_copy_material_types_to_group_on_group_set();

-- 4.2 Ao alterar tipos no potencial, refletir no grupo (se houver unificado com grupo)
create or replace function public.tg_sync_potential_material_types_to_group()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_group_id uuid;
begin
  -- localizar um unificado com grupo para este potencial
  select economic_group_id
    into v_group_id
    from public.purchases_unified_suppliers
   where potential_supplier_id = coalesce(new.supplier_id, old.supplier_id)
     and economic_group_id is not null
   limit 1;

  if v_group_id is null then
    return null;
  end if;

  if tg_op = 'INSERT' then
    insert into public.purchases_supplier_group_material_types (group_id, material_type_id, created_by)
    values (v_group_id, new.material_type_id, coalesce(auth.uid(), new.created_by))
    on conflict do nothing;
  elsif tg_op = 'DELETE' then
    delete from public.purchases_supplier_group_material_types
     where group_id = v_group_id
       and material_type_id = old.material_type_id;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_sync_potential_material_types_to_group_ins on public.purchases_potential_supplier_material_types;
drop trigger if exists trg_sync_potential_material_types_to_group_del on public.purchases_potential_supplier_material_types;

create trigger trg_sync_potential_material_types_to_group_ins
after insert on public.purchases_potential_supplier_material_types
for each row execute function public.tg_sync_potential_material_types_to_group();

create trigger trg_sync_potential_material_types_to_group_del
after delete on public.purchases_potential_supplier_material_types
for each row execute function public.tg_sync_potential_material_types_to_group();

-- 5) Correção pontual de status: onde não há Protheus e não está 'archived', ajustar para 'potential_only'
update public.purchases_unified_suppliers us
   set status = 'potential_only',
       updated_at = now()
 where us.status <> 'archived'
   and us.potential_supplier_id is not null
   and (us.protheus_filial is null or us.protheus_cod is null or us.protheus_loja is null);
