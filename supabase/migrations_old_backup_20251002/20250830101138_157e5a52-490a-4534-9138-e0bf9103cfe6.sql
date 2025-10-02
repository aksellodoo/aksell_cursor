
-- 1) Tipo para status do cliente unificado (reflete o estado de vínculo)
create type if not exists public.unified_account_status as enum (
  'lead_only',
  'customer',
  'lead_and_customer',
  'archived'
);

-- 2) Tabela principal de "Cliente Unificado"
create table if not exists public.unified_accounts (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,                             -- Nome visível (exibição/consulta)
  status public.unified_account_status not null default 'lead_only',
  
  -- Vínculo a Lead (não criamos FK para auth.users, e mantemos coerência com o padrão do projeto)
  lead_id uuid null,                                      -- sales_leads.id (sem FK para evitar acoplamentos e RLS recursivo)

  -- Vínculo a Cliente Protheus (SA1010)
  protheus_table_id uuid null,                            -- ex: PROTHEUS_TABLES.SA1010_CLIENTES
  protheus_filial text null,
  protheus_cod text null,
  protheus_loja text null,

  -- Campos normalizados (snapshot) para pesquisa rápida e exibição
  cnpj text null,
  email text null,
  phone text null,
  uf text null,
  city text null,
  vendor text null,
  notes text null,

  created_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Pelo menos uma origem deve estar presente (Lead ou Protheus)
  constraint unified_accounts_has_source check (
    lead_id is not null
    or (protheus_table_id is not null and protheus_filial is not null and protheus_cod is not null and protheus_loja is not null)
  )
);

-- 3) Índices e unicidade para evitar duplicações
-- Um lead só pode estar em um Cliente Unificado
create unique index if not exists unified_accounts_unique_lead
  on public.unified_accounts (lead_id)
  where lead_id is not null;

-- Uma unidade (filial+cod+loja) só pode estar em um Cliente Unificado por tabela Protheus
create unique index if not exists unified_accounts_unique_protheus_unit
  on public.unified_accounts (protheus_table_id, protheus_filial, protheus_cod, protheus_loja)
  where protheus_table_id is not null;

-- Busca por nome
create index if not exists unified_accounts_display_name_idx
  on public.unified_accounts (lower(display_name));

-- 4) Triggers utilitários (funções já existem no projeto)
drop trigger if exists trg_unified_accounts_updated_at on public.unified_accounts;
create trigger trg_unified_accounts_updated_at
before update on public.unified_accounts
for each row execute function public.tg_set_updated_at();

drop trigger if exists trg_unified_accounts_normalize_cnpj on public.unified_accounts;
create trigger trg_unified_accounts_normalize_cnpj
before insert or update on public.unified_accounts
for each row execute function public.tg_normalize_cnpj();

-- 5) RLS
alter table public.unified_accounts enable row level security;

-- Leitura: todos autenticados
drop policy if exists "Unified accounts viewable by authenticated" on public.unified_accounts;
create policy "Unified accounts viewable by authenticated"
on public.unified_accounts
for select
to authenticated
using (true);

-- Insert por criador ou admins/diretores
drop policy if exists "Unified accounts insert by creator or admins" on public.unified_accounts;
create policy "Unified accounts insert by creator or admins"
on public.unified_accounts
for insert
to authenticated
with check (
  created_by = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin','director')
  )
);

-- Update por criador ou admins/diretores
drop policy if exists "Unified accounts update by owner or admins" on public.unified_accounts;
create policy "Unified accounts update by owner or admins"
on public.unified_accounts
for update
to authenticated
using (
  created_by = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin','director')
  )
)
with check (
  created_by = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin','director')
  )
);

-- Delete por criador ou admins/diretores
drop policy if exists "Unified accounts delete by owner or admins" on public.unified_accounts;
create policy "Unified accounts delete by owner or admins"
on public.unified_accounts
for delete
to authenticated
using (
  created_by = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin','director')
  )
);
