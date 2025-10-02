
-- 1) Tabela de Leads
create table if not exists public.sales_leads (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  segment_id uuid not null references public.site_product_segments(id) on delete restrict,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índice para pesquisa por nome (case-insensitive)
create index if not exists sales_leads_company_name_idx
  on public.sales_leads (lower(company_name));

-- 2) RLS
alter table public.sales_leads enable row level security;

-- SELECT: dono ou admin/diretor
create policy "Leads viewable by owner or admins"
  on public.sales_leads
  for select
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['admin','director'])
    )
  );

-- INSERT: apenas se o registro for do próprio usuário
create policy "Leads insert by owner"
  on public.sales_leads
  for insert
  with check (created_by = auth.uid());

-- UPDATE: dono ou admin/diretor
create policy "Leads update by owner or admins"
  on public.sales_leads
  for update
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['admin','director'])
    )
  )
  with check (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['admin','director'])
    )
  );

-- DELETE: dono ou admin/diretor
create policy "Leads delete by owner or admins"
  on public.sales_leads
  for delete
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['admin','director'])
    )
  );

-- 3) Trigger para updated_at
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'trg_sales_leads_updated_at'
  ) then
    create trigger trg_sales_leads_updated_at
    before update on public.sales_leads
    for each row
    execute function public.tg_set_updated_at();
  end if;
end;
$$;
