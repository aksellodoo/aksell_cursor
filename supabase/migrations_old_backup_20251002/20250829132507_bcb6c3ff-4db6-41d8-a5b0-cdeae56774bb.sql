
-- 1) Tabela de vínculos Comprador-Usuário
create table if not exists public.buyer_user_links (
  id uuid primary key default gen_random_uuid(),
  buyer_code text not null,
  user_id uuid not null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índice único para garantir no máximo um vínculo por comprador
create unique index if not exists buyer_user_links_buyer_code_key
  on public.buyer_user_links (buyer_code);

-- Habilitar RLS
alter table public.buyer_user_links enable row level security;

-- Gatilho para manter updated_at
create trigger buyer_user_links_set_updated_at
before update on public.buyer_user_links
for each row execute function public.tg_set_updated_at();

-- 2) Políticas de segurança
-- Leitura: qualquer usuário autenticado pode ver (mesmo padrão usado em várias tabelas da app)
create policy "Buyer links viewable by authenticated"
  on public.buyer_user_links
  for select
  using (true);

-- Inserção: criador do vínculo ou admin/diretor
create policy "Buyer links insert by creator or admins"
  on public.buyer_user_links
  for insert
  with check (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = any (array['admin','director'])
    )
  );

-- Atualização: criador do vínculo ou admin/diretor
create policy "Buyer links update by owner or admins"
  on public.buyer_user_links
  for update
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = any (array['admin','director'])
    )
  )
  with check (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = any (array['admin','director'])
    )
  );

-- Exclusão: criador do vínculo ou admin/diretor
create policy "Buyer links delete by owner or admins"
  on public.buyer_user_links
  for delete
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = any (array['admin','director'])
    )
  );
