
-- 1) Tabela mestre de Tipos de Materiais/Serviços (Compras)
create table if not exists public.purchases_material_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#3B82F6',
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) RLS
alter table public.purchases_material_types enable row level security;

-- a) SELECT por qualquer usuário autenticado
create policy "Material types viewable by authenticated"
  on public.purchases_material_types
  for select
  to authenticated
  using (true);

-- b) INSERT: apenas pelo próprio criador (created_by = auth.uid())
create policy "Material types insert by creator"
  on public.purchases_material_types
  for insert
  to authenticated
  with check (created_by = auth.uid());

-- c) UPDATE: pelo criador OU admin/diretor
create policy "Material types update by owner or admins"
  on public.purchases_material_types
  for update
  to authenticated
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin','director')
    )
  )
  with check (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin','director')
    )
  );

-- d) DELETE: pelo criador OU admin/diretor
create policy "Material types delete by owner or admins"
  on public.purchases_material_types
  for delete
  to authenticated
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin','director')
    )
  );

-- 3) Triggers (usam funções já existentes no projeto)
-- Preenche created_by com auth.uid() se vier NULL
drop trigger if exists trg_purchases_material_types_set_created_by on public.purchases_material_types;
create trigger trg_purchases_material_types_set_created_by
  before insert on public.purchases_material_types
  for each row
  execute function public.set_created_by_default();

-- Mantém updated_at sempre atualizado
drop trigger if exists trg_purchases_material_types_set_updated_at on public.purchases_material_types;
create trigger trg_purchases_material_types_set_updated_at
  before update on public.purchases_material_types
  for each row
  execute function public.set_current_timestamp_updated_at();

-- 4) Unicidade de nome (ignorando acentos, caixa e espaços extras)
drop index if exists purchases_material_types_unique_name_idx;
create unique index purchases_material_types_unique_name_idx
  on public.purchases_material_types (normalize_text(name));

-- 5) Índice auxiliar por data de criação (ordenações/recentes)
drop index if exists purchases_material_types_created_at_idx;
create index purchases_material_types_created_at_idx
  on public.purchases_material_types (created_at desc);
