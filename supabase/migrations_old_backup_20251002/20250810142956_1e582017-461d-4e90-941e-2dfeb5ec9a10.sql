
-- 1) Tabela de usuários de portal
create table if not exists public.portal_users (
  id uuid primary key default gen_random_uuid(),
  portal_id uuid not null references public.portals(id) on delete cascade,
  name text not null,
  email text not null,
  is_active boolean not null default true,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Índice de unicidade por portal + email (case-insensitive)
create unique index if not exists portal_users_unique_email_per_portal
  on public.portal_users (portal_id, lower(email));

-- 3) Trigger para updated_at
create trigger set_updated_at_portal_users
before update on public.portal_users
for each row execute procedure public.set_updated_at();

-- 4) Habilitar RLS
alter table public.portal_users enable row level security;

-- 5) Policies

-- SELECT: admins/diretores podem ver todos
create policy "Admins and directors can view portal users"
on public.portal_users
for select
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('admin','director')
  )
);

-- SELECT: dono do portal pode ver usuários do seu portal
create policy "Portal owner can view portal users"
on public.portal_users
for select
using (
  exists (
    select 1
    from public.portals p
    where p.id = portal_users.portal_id
      and p.created_by = auth.uid()
  )
);

-- INSERT: admins/diretores podem inserir
create policy "Admins and directors can insert portal users"
on public.portal_users
for insert
with check (
  auth.uid() = created_by
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('admin','director')
  )
);

-- INSERT: dono do portal pode inserir nos seus portais
create policy "Portal owner can insert portal users"
on public.portal_users
for insert
with check (
  auth.uid() = created_by
  and exists (
    select 1
    from public.portals p
    where p.id = portal_id
      and p.created_by = auth.uid()
  )
);

-- UPDATE: admins/diretores podem atualizar
create policy "Admins and directors can update portal users"
on public.portal_users
for update
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('admin','director')
  )
)
with check (true);

-- UPDATE: dono do portal pode atualizar seus usuários
create policy "Portal owner can update portal users"
on public.portal_users
for update
using (
  exists (
    select 1
    from public.portals p
    where p.id = portal_users.portal_id
      and p.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.portals p
    where p.id = portal_id
      and p.created_by = auth.uid()
  )
);

-- DELETE: admins/diretores podem remover
create policy "Admins and directors can delete portal users"
on public.portal_users
for delete
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('admin','director')
  )
);

-- DELETE: dono do portal pode remover usuários do seu portal
create policy "Portal owner can delete portal users"
on public.portal_users
for delete
using (
  exists (
    select 1
    from public.portals p
    where p.id = portal_users.portal_id
      and p.created_by = auth.uid()
  )
);
