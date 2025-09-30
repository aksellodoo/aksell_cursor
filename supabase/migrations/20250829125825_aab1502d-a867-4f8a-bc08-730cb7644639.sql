
-- 1) Tabela de vínculo Vendedor ↔ Usuário (não altera a tabela Protheus)
create table if not exists public.vendor_user_links (
  id uuid primary key default gen_random_uuid(),
  vendor_code text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_vendor_user_links_vendor_code unique (vendor_code),
  constraint chk_vendor_user_links_vendor_code_not_empty check (btrim(vendor_code) <> '')
);

-- 2) Trigger de updated_at
create trigger tg_vendor_user_links_updated_at
before update on public.vendor_user_links
for each row
execute function public.tg_set_updated_at();

-- 3) Habilitar RLS
alter table public.vendor_user_links enable row level security;

-- 4) Políticas de acesso
-- Leitura: qualquer usuário autenticado com perfil pode ler os vínculos
create policy "Authenticated users can view vendor-user links"
on public.vendor_user_links
for select
using (exists (select 1 from public.profiles p where p.id = auth.uid()));

-- Inserção: administradores/diretores OU criador do registro
create policy "Admins/directors can insert vendor-user links"
on public.vendor_user_links
for insert
with check (exists (
  select 1 from public.profiles p 
  where p.id = auth.uid() and p.role in ('admin','director')
));

create policy "Creators can insert own vendor-user links"
on public.vendor_user_links
for insert
with check (created_by = auth.uid());

-- Atualização: administradores/diretores OU criador do registro
create policy "Admins/directors can update vendor-user links"
on public.vendor_user_links
for update
using (exists (
  select 1 from public.profiles p 
  where p.id = auth.uid() and p.role in ('admin','director')
))
with check (exists (
  select 1 from public.profiles p 
  where p.id = auth.uid() and p.role in ('admin','director')
));

create policy "Creators can update own vendor-user links"
on public.vendor_user_links
for update
using (created_by = auth.uid())
with check (created_by = auth.uid());

-- Exclusão: administradores/diretores OU criador do registro
create policy "Admins/directors can delete vendor-user links"
on public.vendor_user_links
for delete
using (exists (
  select 1 from public.profiles p 
  where p.id = auth.uid() and p.role in ('admin','director')
));

create policy "Creators can delete own vendor-user links"
on public.vendor_user_links
for delete
using (created_by = auth.uid());
