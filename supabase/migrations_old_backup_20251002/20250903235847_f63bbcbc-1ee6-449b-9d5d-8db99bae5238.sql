
-- 1) Criar sequência para numerador dos leads (id sequencial)
create sequence if not exists public.sales_leads_lead_number_seq;

-- 2) Adicionar coluna lead_number e configurar default pela sequência
alter table public.sales_leads
  add column if not exists lead_number bigint;

alter table public.sales_leads
  alter column lead_number set default nextval('public.sales_leads_lead_number_seq');

-- 3) Preencher os registros já existentes
update public.sales_leads
   set lead_number = nextval('public.sales_leads_lead_number_seq')
 where lead_number is null;

-- 4) Garantir NOT NULL e unicidade do sequencial
alter table public.sales_leads
  alter column lead_number set not null;

create unique index if not exists sales_leads_lead_number_uidx
  on public.sales_leads(lead_number);

-- 5) Criar lead_code como coluna gerada LE-<lead_number> e garantir unicidade
alter table public.sales_leads
  add column if not exists lead_code text generated always as ('LE-' || lead_number::text) stored;

create unique index if not exists sales_leads_lead_code_uidx
  on public.sales_leads(lead_code);
