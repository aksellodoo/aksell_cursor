
-- 1) Tabela para tipos de material por fornecedor unificado
create table if not exists public.purchases_unified_supplier_material_types (
  supplier_id uuid not null references public.purchases_unified_suppliers(id) on delete cascade,
  material_type_id uuid not null references public.purchases_material_types(id) on delete cascade,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  constraint purchases_unified_supplier_material_types_pkey primary key (supplier_id, material_type_id)
);

-- 2) Habilitar RLS
alter table public.purchases_unified_supplier_material_types enable row level security;

-- 3) Políticas RLS
-- Leitura por qualquer usuário autenticado
create policy "Supplier material types viewable by authenticated"
  on public.purchases_unified_supplier_material_types
  for select
  using (true);

-- Inserção apenas pelo próprio usuário (created_by = auth.uid())
create policy "Add supplier material types (owner)"
  on public.purchases_unified_supplier_material_types
  for insert
  with check (created_by = auth.uid());

-- Remoção apenas pelo criador
create policy "Remove own supplier material types"
  on public.purchases_unified_supplier_material_types
  for delete
  using (created_by = auth.uid());

-- 4) Trigger para preencher created_by automaticamente quando não enviado
drop trigger if exists set_created_by_on_pu_supp_mat_types on public.purchases_unified_supplier_material_types;
create trigger set_created_by_on_pu_supp_mat_types
before insert on public.purchases_unified_supplier_material_types
for each row execute function public.set_created_by_default();

-- 5) Índices úteis
create index if not exists idx_pu_supp_mat_types_supplier on public.purchases_unified_supplier_material_types(supplier_id);
create index if not exists idx_pu_supp_mat_types_material on public.purchases_unified_supplier_material_types(material_type_id);
