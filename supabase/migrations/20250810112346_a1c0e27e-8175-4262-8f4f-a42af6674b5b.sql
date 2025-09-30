
-- 1) Enum para o tipo de stakeholder
create type public.portal_stakeholder as enum ('cliente', 'fornecedor', 'funcionario', 'outro');

-- 2) Tabela de Portais
create table public.portals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stakeholder public.portal_stakeholder not null,
  is_active boolean not null default true,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) Habilitar RLS
alter table public.portals enable row level security;

-- 4) Políticas de acesso

-- Qualquer usuário autenticado pode visualizar os portais
create policy "Authenticated users can view portals"
  on public.portals
  for select
  to authenticated
  using (true);

-- Apenas admin e director podem criar, exigindo created_by = auth.uid()
create policy "Admins and directors can create portals"
  on public.portals
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid()
        and profiles.role in ('admin','director')
    )
  );

-- Apenas admin e director podem atualizar
create policy "Admins and directors can update portals"
  on public.portals
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid()
        and profiles.role in ('admin','director')
    )
  );

-- Apenas admin e director podem excluir
create policy "Admins and directors can delete portals"
  on public.portals
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid()
        and profiles.role in ('admin','director')
    )
  );

-- 5) Trigger para manter updated_at
create trigger update_portals_updated_at
  before update on public.portals
  for each row
  execute function public.set_updated_at();
