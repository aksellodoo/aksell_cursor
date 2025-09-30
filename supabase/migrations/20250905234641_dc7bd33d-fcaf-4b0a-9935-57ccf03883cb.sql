
-- 1) Normalização de representative_id quando atendimento = 'direct' (ambas as tabelas)

create or replace function public.tg_normalize_attendance_fields()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  -- Normalizar valor
  if new.attendance_type is null or btrim(new.attendance_type) = '' then
    new.attendance_type := 'direct';
  else
    new.attendance_type := lower(btrim(new.attendance_type));
  end if;

  -- Se direto, zera representante
  if new.attendance_type = 'direct' then
    new.representative_id := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_normalize_attendance_potential on public.purchases_potential_suppliers;
create trigger trg_normalize_attendance_potential
before insert or update on public.purchases_potential_suppliers
for each row execute function public.tg_normalize_attendance_fields();

drop trigger if exists trg_normalize_attendance_unified on public.purchases_unified_suppliers;
create trigger trg_normalize_attendance_unified
before insert or update on public.purchases_unified_suppliers
for each row execute function public.tg_normalize_attendance_fields();

-- 2) Guard anti-recursão + sincronização bidirecional

create or replace function public.tg_sync_attendance_unified_to_potential()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_guard text;
begin
  -- Evitar recursão
  v_guard := current_setting('app.attendance_sync', true);
  if v_guard = '1' then
    return new;
  end if;

  -- Só se houver potencial vinculado
  if new.potential_supplier_id is null then
    return new;
  end if;

  -- Em INSERT sempre sincroniza; em UPDATE, só se mudou algo relevante
  if tg_op = 'INSERT'
     or new.attendance_type is distinct from old.attendance_type
     or coalesce(new.representative_id, '00000000-0000-0000-0000-000000000000')
        is distinct from coalesce(old.representative_id, '00000000-0000-0000-0000-000000000000')
  then
    perform set_config('app.attendance_sync','1', true);
    update public.purchases_potential_suppliers
       set attendance_type  = new.attendance_type,
           representative_id = case when new.attendance_type = 'direct' then null else new.representative_id end,
           updated_at = now()
     where id = new.potential_supplier_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_attendance_unified_to_potential on public.purchases_unified_suppliers;
create trigger trg_sync_attendance_unified_to_potential
after insert or update of attendance_type, representative_id on public.purchases_unified_suppliers
for each row execute function public.tg_sync_attendance_unified_to_potential();

create or replace function public.tg_sync_attendance_potential_to_unified()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_guard text;
begin
  -- Evitar recursão
  v_guard := current_setting('app.attendance_sync', true);
  if v_guard = '1' then
    return new;
  end if;

  -- Em INSERT sempre sincroniza; em UPDATE, só se mudou algo relevante
  if tg_op = 'INSERT'
     or new.attendance_type is distinct from old.attendance_type
     or coalesce(new.representative_id, '00000000-0000-0000-0000-000000000000')
        is distinct from coalesce(old.representative_id, '00000000-0000-0000-0000-000000000000')
  then
    perform set_config('app.attendance_sync','1', true);
    update public.purchases_unified_suppliers
       set attendance_type  = new.attendance_type,
           representative_id = case when new.attendance_type = 'direct' then null else new.representative_id end,
           updated_at = now()
     where potential_supplier_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_attendance_potential_to_unified on public.purchases_potential_suppliers;
create trigger trg_sync_attendance_potential_to_unified
after insert or update of attendance_type, representative_id on public.purchases_potential_suppliers
for each row execute function public.tg_sync_attendance_potential_to_unified();

-- 3) Ajustar a RPC de "Criar faltantes" para copiar attendance_type e representative_id

create or replace function public.create_missing_unified_suppliers()
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_created int := 0;
begin
  with to_create as (
    select
      ps.id as potential_id,
      ps.cnpj,
      ps.attendance_type,
      ps.representative_id,
      ps.assigned_buyer_cod,
      ps.assigned_buyer_filial
    from public.purchases_potential_suppliers ps
    left join public.purchases_unified_suppliers us
      on us.potential_supplier_id = ps.id
    where us.id is null
  ),
  inserted_rows as (
    insert into public.purchases_unified_suppliers(
      potential_supplier_id,
      cnpj,
      attendance_type,
      representative_id,
      assigned_buyer_cod,
      assigned_buyer_filial,
      status,
      protheus_filial,
      protheus_cod,
      protheus_loja,
      created_by
    )
    select
      potential_id,
      cnpj,
      coalesce(attendance_type, 'direct'),
      case when coalesce(attendance_type, 'direct') = 'direct' then null else representative_id end,
      assigned_buyer_cod,
      assigned_buyer_filial,
      'potential_only',
      null, null, null,
      auth.uid()
    from to_create
    returning id, potential_supplier_id
  ),
  tags_copied as (
    insert into public.purchases_unified_supplier_tags (supplier_id, tag_id, created_by)
    select
      ir.id as supplier_id,
      ppt.tag_id,
      auth.uid() as created_by
    from inserted_rows ir
    join public.purchases_potential_supplier_tags ppt
      on ppt.supplier_id = ir.potential_supplier_id
    where not exists (
      select 1
        from public.purchases_unified_supplier_tags ut
       where ut.supplier_id = ir.id
         and ut.tag_id = ppt.tag_id
    )
    returning 1
  )
  select count(*) into v_created from inserted_rows;

  return json_build_object(
    'success', true,
    'created_count', coalesce(v_created,0)
  );
end;
$function$;
