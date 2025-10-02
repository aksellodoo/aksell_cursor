
-- 1) Tabela de assinaturas do usuário
create table if not exists public.email_signatures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null default 'Assinatura',
  html text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Habilitar RLS
alter table public.email_signatures enable row level security;

-- Políticas: o próprio usuário gerencia suas assinaturas
create policy "Signatures are viewable by owner"
  on public.email_signatures
  for select
  using (auth.uid() = user_id);

create policy "Signatures can be inserted by owner"
  on public.email_signatures
  for insert
  with check (auth.uid() = user_id);

create policy "Signatures can be updated by owner"
  on public.email_signatures
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Signatures can be deleted by owner"
  on public.email_signatures
  for delete
  using (auth.uid() = user_id);

-- Trigger para updated_at
create or replace function public.update_email_signatures_updated_at()
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

drop trigger if exists trg_update_email_signatures_updated_at on public.email_signatures;
create trigger trg_update_email_signatures_updated_at
before update on public.email_signatures
for each row execute procedure public.update_email_signatures_updated_at();

-- 2) Tabela de alvos (canais) de cada assinatura
create table if not exists public.email_signature_targets (
  id uuid primary key default gen_random_uuid(),
  signature_id uuid not null references public.email_signatures(id) on delete cascade,
  user_id uuid not null,
  microsoft_account_id uuid null references public.microsoft_accounts(id) on delete cascade,
  shared_mailbox_id uuid null references public.microsoft_shared_mailboxes(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- exatamente um dos campos deve ser preenchido
  constraint email_signature_targets_one_target_chk
    check (
      (microsoft_account_id is not null and shared_mailbox_id is null)
      or (microsoft_account_id is null and shared_mailbox_id is not null)
    )
);

-- Índices/uniques para evitar mapeamentos duplicados
create index if not exists idx_email_signature_targets_user on public.email_signature_targets(user_id);

create unique index if not exists uq_email_signature_targets_msacc
  on public.email_signature_targets(signature_id, microsoft_account_id)
  where microsoft_account_id is not null;

create unique index if not exists uq_email_signature_targets_shared
  on public.email_signature_targets(signature_id, shared_mailbox_id)
  where shared_mailbox_id is not null;

-- Habilitar RLS
alter table public.email_signature_targets enable row level security;

-- Policies:
-- 2.1 SELECT: dono pode ver
create policy "Signature targets are viewable by owner"
  on public.email_signature_targets
  for select
  using (auth.uid() = user_id);

-- 2.2 INSERT: dono pode inserir e somente se a assinatura e o alvo pertencem a ele
create policy "Signature targets can be inserted by owner with ownership checks"
  on public.email_signature_targets
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.email_signatures s
      where s.id = signature_id and s.user_id = auth.uid()
    )
    and (
      (microsoft_account_id is not null and exists (
         select 1 from public.microsoft_accounts ma
         where ma.id = microsoft_account_id and ma.user_id = auth.uid()
      ))
      or
      (shared_mailbox_id is not null and exists (
         select 1 from public.microsoft_shared_mailboxes sm
         where sm.id = shared_mailbox_id and sm.user_id = auth.uid()
      ))
    )
  );

-- 2.3 UPDATE: mesmas condições do insert + precisa ser do dono
create policy "Signature targets can be updated by owner with ownership checks"
  on public.email_signature_targets
  for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.email_signatures s
      where s.id = signature_id and s.user_id = auth.uid()
    )
    and (
      (microsoft_account_id is not null and exists (
         select 1 from public.microsoft_accounts ma
         where ma.id = microsoft_account_id and ma.user_id = auth.uid()
      ))
      or
      (shared_mailbox_id is not null and exists (
         select 1 from public.microsoft_shared_mailboxes sm
         where sm.id = shared_mailbox_id and sm.user_id = auth.uid()
      ))
    )
  );

-- 2.4 DELETE: dono pode excluir
create policy "Signature targets can be deleted by owner"
  on public.email_signature_targets
  for delete
  using (auth.uid() = user_id);
