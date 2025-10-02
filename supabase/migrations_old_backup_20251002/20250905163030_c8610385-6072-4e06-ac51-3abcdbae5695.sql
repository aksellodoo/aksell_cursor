
-- 1) Tabela de relação fornecedor x tipo de material
create table if not exists public.purchases_potential_supplier_material_types (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.purchases_potential_suppliers(id) on delete cascade,
  material_type_id uuid not null references public.purchases_material_types(id) on delete restrict,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_supplier_material_type unique (supplier_id, material_type_id)
);

-- Índices auxiliares
create index if not exists idx_ppsmt_supplier on public.purchases_potential_supplier_material_types(supplier_id);
create index if not exists idx_ppsmt_material_type on public.purchases_potential_supplier_material_types(material_type_id);

-- Triggers padrão
drop trigger if exists trg_ppsmt_set_created_by on public.purchases_potential_supplier_material_types;
create trigger trg_ppsmt_set_created_by
before insert on public.purchases_potential_supplier_material_types
for each row execute function public.set_created_by_default();

drop trigger if exists trg_ppsmt_set_updated_at on public.purchases_potential_supplier_material_types;
create trigger trg_ppsmt_set_updated_at
before update on public.purchases_potential_supplier_material_types
for each row execute function public.set_current_timestamp_updated_at();

-- Habilitar RLS
alter table public.purchases_potential_supplier_material_types enable row level security;

-- Policies:
-- SELECT: qualquer usuário autenticado pode ler (as regras de exibição podem ser refinadas depois, se necessário)
drop policy if exists "ppsm_types selectable by authenticated" on public.purchases_potential_supplier_material_types;
create policy "ppsm_types selectable by authenticated"
  on public.purchases_potential_supplier_material_types
  for select
  using (true);

-- Helper para verificar se é admin/diretor
-- (usa o mesmo padrão das outras tabelas do projeto)
-- INSERT: criador OU admin/diretor OU criador do fornecedor pai
drop policy if exists "ppsm_types insert by owner/admin/parent-owner" on public.purchases_potential_supplier_material_types;
create policy "ppsm_types insert by owner/admin/parent-owner"
  on public.purchases_potential_supplier_material_types
  for insert
  with check (
    (created_by = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','director'))
    or exists (
      select 1 from public.purchases_potential_suppliers s
      where s.id = supplier_id and s.created_by = auth.uid()
    )
  );

-- UPDATE: mesmo critério de ownership/adm
drop policy if exists "ppsm_types update by owner/admin/parent-owner" on public.purchases_potential_supplier_material_types;
create policy "ppsm_types update by owner/admin/parent-owner"
  on public.purchases_potential_supplier_material_types
  for update
  using (
    (created_by = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','director'))
    or exists (
      select 1 from public.purchases_potential_suppliers s
      where s.id = supplier_id and s.created_by = auth.uid()
    )
  )
  with check (
    (created_by = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','director'))
    or exists (
      select 1 from public.purchases_potential_suppliers s
      where s.id = supplier_id and s.created_by = auth.uid()
    )
  );

-- DELETE: mesmo critério de ownership/adm
drop policy if exists "ppsm_types delete by owner/admin/parent-owner" on public.purchases_potential_supplier_material_types;
create policy "ppsm_types delete by owner/admin/parent-owner"
  on public.purchases_potential_supplier_material_types
  for delete
  using (
    (created_by = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','director'))
    or exists (
      select 1 from public.purchases_potential_suppliers s
      where s.id = supplier_id and s.created_by = auth.uid()
    )
  );

-- 2) Garantir que os 5 tipos clássicos existam na tabela purchases_material_types (para migrar o legado enum[])
-- Ajuste as cores conforme preferir
insert into public.purchases_material_types (name, color, is_active)
select t.name, t.color, true
from (values
  ('Matérias Primas', '#3b82f6'),
  ('Embalagens', '#10b981'),
  ('Indiretos', '#f59e0b'),
  ('Transportadora', '#6366f1'),
  ('Serviços', '#8b5cf6')
) as t(name, color)
where not exists (
  select 1 from public.purchases_material_types mt
  where public.normalize_text(mt.name) = public.normalize_text(t.name)
);

-- 3) Backfill: migrar os valores atuais de purchases_potential_suppliers.material_types (enum[]) para a nova tabela relacional
-- Mapeando os enums -> nomes
insert into public.purchases_potential_supplier_material_types (supplier_id, material_type_id)
select s.id as supplier_id, mt2.id as material_type_id
from public.purchases_potential_suppliers s
join lateral unnest(s.material_types) as mt_enum on true
join public.purchases_material_types mt2
  on public.normalize_text(mt2.name) = public.normalize_text(
    case (mt_enum::text)
      when 'materias_primas' then 'Matérias Primas'
      when 'embalagens' then 'Embalagens'
      when 'indiretos' then 'Indiretos'
      when 'transportadora' then 'Transportadora'
      when 'servicos' then 'Serviços'
    end
  )
on conflict do nothing;

-- Observação: NÃO removemos a coluna antiga material_types agora.
-- O frontend será atualizado para ler/gravar pela nova tabela de relação.
