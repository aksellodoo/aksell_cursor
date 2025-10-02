
-- 1) Tabela para armazenar emails completos enviados pelo Chatter
create table if not exists public.chatter_email_messages (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.chatter_messages(id) on delete cascade,
  record_type text not null,
  record_id uuid not null,
  author_id uuid not null,
  subject text not null,
  html text not null,
  "to" jsonb not null default '[]'::jsonb,
  cc jsonb not null default '[]'::jsonb,
  bcc jsonb not null default '[]'::jsonb,
  attachments jsonb not null default '[]'::jsonb,
  provider_message_id text,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Índices úteis
create unique index if not exists chatter_email_messages_message_id_idx on public.chatter_email_messages(message_id);
create index if not exists chatter_email_messages_record_idx on public.chatter_email_messages(record_type, record_id);

-- 2) RLS
alter table public.chatter_email_messages enable row level security;

-- Política: usuários podem visualizar (igual ao chatter_messages existente)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chatter_email_messages'
      and policyname = 'Users can view chatter emails'
  ) then
    create policy "Users can view chatter emails"
      on public.chatter_email_messages
      for select
      using (true);
  end if;
end$$;

-- Política: usuários podem criar seus próprios registros
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chatter_email_messages'
      and policyname = 'Users can create own chatter emails'
  ) then
    create policy "Users can create own chatter emails"
      on public.chatter_email_messages
      for insert
      with check (auth.uid() = author_id);
  end if;
end$$;

-- Política: opcionalmente permitir deletar o próprio registro
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chatter_email_messages'
      and policyname = 'Users can delete own chatter emails'
  ) then
    create policy "Users can delete own chatter emails"
      on public.chatter_email_messages
      for delete
      using (auth.uid() = author_id);
  end if;
end$$;
