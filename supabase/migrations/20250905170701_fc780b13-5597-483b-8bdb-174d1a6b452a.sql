
-- 1) Criar tabela de vínculo: grupos de fornecedores x tipos de materiais (dinâmicos)
create table if not exists public.purchases_supplier_group_material_types (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.protheus_supplier_groups(id) on delete cascade,
  material_type_id uuid not null references public.purchases_material_types(id),
  created_by uuid not null,
  created_at timestamptz not null default now()
);

-- Índices e restrições
create index if not exists idx_psgmt_group on public.purchases_supplier_group_material_types(group_id);
create index if not exists idx_psgmt_material_type on public.purchases_supplier_group_material_types(material_type_id);
create unique index if not exists uq_psgmt_group_material 
  on public.purchases_supplier_group_material_types(group_id, material_type_id);

-- 2) Habilitar RLS e políticas
alter table public.purchases_supplier_group_material_types enable row level security;

drop policy if exists "PSGMT viewable by authenticated" on public.purchases_supplier_group_material_types;
create policy "PSGMT viewable by authenticated"
on public.purchases_supplier_group_material_types
for select
to authenticated
using (true);

drop policy if exists "PSGMT insert by owner or admins" on public.purchases_supplier_group_material_types;
create policy "PSGMT insert by owner or admins"
on public.purchases_supplier_group_material_types
for insert
to authenticated
with check (
  created_by = auth.uid()
  or exists (
    select 1 from public.profiles p 
     where p.id = auth.uid() and p.role in ('admin','director')
  )
);

drop policy if exists "PSGMT delete by owner or admins" on public.purchases_supplier_group_material_types;
create policy "PSGMT delete by owner or admins"
on public.purchases_supplier_group_material_types
for delete
to authenticated
using (
  created_by = auth.uid()
  or exists (
    select 1 from public.profiles p 
     where p.id = auth.uid() and p.role in ('admin','director')
  )
);

-- 3) Migrar dados do mapa antigo (protheus_supplier_material_types_map) para a nova tabela
-- Faz o match por nome normalizado: enum/texto antigo com underscores vs nome do tipo em purchases_material_types
insert into public.purchases_supplier_group_material_types (group_id, material_type_id, created_by)
select 
  mt.group_id,
  pmt.id as material_type_id,
  mt.created_by
from public.protheus_supplier_material_types_map mt
join public.purchases_material_types pmt
  on public.normalize_text(pmt.name) = public.normalize_text(replace(mt.material_type::text, '_', ' '))
where pmt.is_active = true
on conflict (group_id, material_type_id) do nothing;
