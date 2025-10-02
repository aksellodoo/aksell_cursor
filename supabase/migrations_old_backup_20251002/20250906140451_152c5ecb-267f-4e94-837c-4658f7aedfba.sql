
-- 1) Função de sincronização: tipos de materiais do UNIFICADO -> POTENCIAL
create or replace function public.tg_sync_unified_material_types_to_potential()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_potential_id uuid;
begin
  -- Encontrar o potencial vinculado ao fornecedor unificado
  select potential_supplier_id
    into v_potential_id
  from public.purchases_unified_suppliers
  where id = coalesce(new.supplier_id, old.supplier_id)
  limit 1;

  -- Se não houver potencial vinculado, não faz nada
  if v_potential_id is null then
    return null;
  end if;

  if tg_op = 'INSERT' then
    insert into public.purchases_potential_supplier_material_types (supplier_id, material_type_id, created_by)
    values (v_potential_id, new.material_type_id, coalesce(new.created_by, auth.uid()))
    on conflict do nothing;

  elsif tg_op = 'DELETE' then
    delete from public.purchases_potential_supplier_material_types
     where supplier_id = v_potential_id
       and material_type_id = old.material_type_id;

  elsif tg_op = 'UPDATE' then
    -- Em caso de mudança do tipo, espelhar como delete antigo + insert novo
    if new.material_type_id is distinct from old.material_type_id then
      delete from public.purchases_potential_supplier_material_types
       where supplier_id = v_potential_id
         and material_type_id = old.material_type_id;

      insert into public.purchases_potential_supplier_material_types (supplier_id, material_type_id, created_by)
      values (v_potential_id, new.material_type_id, coalesce(new.created_by, auth.uid()))
      on conflict do nothing;
    end if;
  end if;

  return null;
end;
$$;

-- 2) Triggers na tabela de tipos por fornecedor unificado
drop trigger if exists trg_sync_unified_mat_types_to_potential_ins on public.purchases_unified_supplier_material_types;
drop trigger if exists trg_sync_unified_mat_types_to_potential_del on public.purchases_unified_supplier_material_types;
drop trigger if exists trg_sync_unified_mat_types_to_potential_upd on public.purchases_unified_supplier_material_types;

create trigger trg_sync_unified_mat_types_to_potential_ins
after insert on public.purchases_unified_supplier_material_types
for each row execute function public.tg_sync_unified_material_types_to_potential();

create trigger trg_sync_unified_mat_types_to_potential_del
after delete on public.purchases_unified_supplier_material_types
for each row execute function public.tg_sync_unified_material_types_to_potential();

create trigger trg_sync_unified_mat_types_to_potential_upd
after update on public.purchases_unified_supplier_material_types
for each row execute function public.tg_sync_unified_material_types_to_potential();
