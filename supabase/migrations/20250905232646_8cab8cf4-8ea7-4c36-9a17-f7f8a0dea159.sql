
-- 1) Sincronização UNIFICADO -> POTENCIAL
drop trigger if exists trg_sync_unified_tags_to_potential on public.purchases_unified_supplier_tags;
drop function if exists public.tg_sync_unified_tags_to_potential();

create or replace function public.tg_sync_unified_tags_to_potential()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_potential uuid;
  v_guard text;
begin
  -- Evitar recursão entre triggers
  v_guard := current_setting('app.tags_sync', true);
  if v_guard = '1' then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    select potential_supplier_id
      into v_potential
      from public.purchases_unified_suppliers
     where id = new.supplier_id
     limit 1;

    if v_potential is not null then
      perform set_config('app.tags_sync', '1', true);
      insert into public.purchases_potential_supplier_tags (supplier_id, tag_id, created_by)
      values (v_potential, new.tag_id, coalesce(new.created_by, auth.uid()))
      on conflict do nothing;
    end if;

    return new;

  elsif tg_op = 'DELETE' then
    select potential_supplier_id
      into v_potential
      from public.purchases_unified_suppliers
     where id = old.supplier_id
     limit 1;

    if v_potential is not null then
      perform set_config('app.tags_sync', '1', true);
      delete from public.purchases_potential_supplier_tags
       where supplier_id = v_potential
         and tag_id = old.tag_id;
    end if;

    return old;

  elsif tg_op = 'UPDATE' then
    if new.tag_id is distinct from old.tag_id then
      select potential_supplier_id
        into v_potential
        from public.purchases_unified_suppliers
       where id = new.supplier_id
       limit 1;

      if v_potential is not null then
        perform set_config('app.tags_sync', '1', true);
        delete from public.purchases_potential_supplier_tags
         where supplier_id = v_potential
           and tag_id = old.tag_id;

        insert into public.purchases_potential_supplier_tags (supplier_id, tag_id, created_by)
        values (v_potential, new.tag_id, coalesce(new.created_by, auth.uid()))
        on conflict do nothing;
      end if;
    end if;

    return new;
  end if;

  return coalesce(new, old);
end;
$$;

create trigger trg_sync_unified_tags_to_potential
after insert or delete or update on public.purchases_unified_supplier_tags
for each row execute function public.tg_sync_unified_tags_to_potential();


-- 2) Sincronização POTENCIAL -> UNIFICADO
drop trigger if exists trg_sync_potential_tags_to_unified on public.purchases_potential_supplier_tags;
drop function if exists public.tg_sync_potential_tags_to_unified();

create or replace function public.tg_sync_potential_tags_to_unified()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_unified uuid;
  v_guard text;
begin
  -- Evitar recursão entre triggers
  v_guard := current_setting('app.tags_sync', true);
  if v_guard = '1' then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    select id
      into v_unified
      from public.purchases_unified_suppliers
     where potential_supplier_id = new.supplier_id
     limit 1;

    if v_unified is not null then
      perform set_config('app.tags_sync', '1', true);
      insert into public.purchases_unified_supplier_tags (supplier_id, tag_id, created_by)
      values (v_unified, new.tag_id, coalesce(new.created_by, auth.uid()))
      on conflict do nothing;
    end if;

    return new;

  elsif tg_op = 'DELETE' then
    select id
      into v_unified
      from public.purchases_unified_suppliers
     where potential_supplier_id = old.supplier_id
     limit 1;

    if v_unified is not null then
      perform set_config('app.tags_sync', '1', true);
      delete from public.purchases_unified_supplier_tags
       where supplier_id = v_unified
         and tag_id = old.tag_id;
    end if;

    return old;

  elsif tg_op = 'UPDATE' then
    if new.tag_id is distinct from old.tag_id then
      select id
        into v_unified
        from public.purchases_unified_suppliers
       where potential_supplier_id = new.supplier_id
       limit 1;

      if v_unified is not null then
        perform set_config('app.tags_sync', '1', true);
        delete from public.purchases_unified_supplier_tags
         where supplier_id = v_unified
           and tag_id = old.tag_id;

        insert into public.purchases_unified_supplier_tags (supplier_id, tag_id, created_by)
        values (v_unified, new.tag_id, coalesce(new.created_by, auth.uid()))
        on conflict do nothing;
      end if;
    end if;

    return new;
  end if;

  return coalesce(new, old);
end;
$$;

create trigger trg_sync_potential_tags_to_unified
after insert or delete or update on public.purchases_potential_supplier_tags
for each row execute function public.tg_sync_potential_tags_to_unified();


-- 3) Ajuste da função que cria unificados faltantes: copiar tags do potencial para o unificado recém-criado
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
      'direct',
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
