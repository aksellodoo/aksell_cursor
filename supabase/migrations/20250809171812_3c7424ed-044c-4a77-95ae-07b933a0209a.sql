
-- Tabela de caixas compartilhadas vinculadas ao usuário
create table if not exists public.microsoft_shared_mailboxes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  display_name text not null,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.microsoft_shared_mailboxes enable row level security;

-- Políticas: o próprio usuário gerencia suas caixas
create policy "Users can view their own shared mailboxes"
  on public.microsoft_shared_mailboxes
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own shared mailboxes"
  on public.microsoft_shared_mailboxes
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own shared mailboxes"
  on public.microsoft_shared_mailboxes
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own shared mailboxes"
  on public.microsoft_shared_mailboxes
  for delete
  using (auth.uid() = user_id);

-- Unicidade por usuário + email (ignorando maiúsc/minúsc)
create unique index if not exists microsoft_shared_mailboxes_user_email_unique
  on public.microsoft_shared_mailboxes (user_id, lower(email));

-- Trigger para atualizar updated_at
create or replace function public.update_shared_mailboxes_updated_at()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_update_shared_mailboxes_updated_at on public.microsoft_shared_mailboxes;

create trigger trg_update_shared_mailboxes_updated_at
before update on public.microsoft_shared_mailboxes
for each row
execute function public.update_shared_mailboxes_updated_at();
