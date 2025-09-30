
  -- 1) Permitir múltiplos segmentos por lead: tabela de junção
create table if not exists public.sales_lead_segments (
  lead_id uuid not null references public.sales_leads(id) on delete cascade,
  segment_id uuid not null references public.site_product_segments(id) on delete restrict,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  primary key (lead_id, segment_id)
);

-- Índices auxiliares
create index if not exists sales_lead_segments_lead_id_idx on public.sales_lead_segments (lead_id);
create index if not exists sales_lead_segments_segment_id_idx on public.sales_lead_segments (segment_id);

-- Habilitar RLS
alter table public.sales_lead_segments enable row level security;

-- SELECT: dono do lead ou admin/diretor
create policy if not exists "Lead segments viewable by owner or admins"
  on public.sales_lead_segments
  for select
  using (
    exists (
      select 1 from public.sales_leads l
      join public.profiles p on p.id = auth.uid()
      where l.id = sales_lead_segments.lead_id
        and (l.created_by = auth.uid() or p.role = any (array['admin','director']))
    )
  );

-- INSERT: dono do lead (com created_by = auth.uid())
create policy if not exists "Lead segments insert by owner"
  on public.sales_lead_segments
  for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.sales_leads l
      where l.id = sales_lead_segments.lead_id
        and l.created_by = auth.uid()
    )
  );

-- DELETE: dono do lead ou admin/diretor
create policy if not exists "Lead segments delete by owner or admins"
  on public.sales_lead_segments
  for delete
  using (
    exists (
      select 1 from public.sales_leads l
      join public.profiles p on p.id = auth.uid()
      where l.id = sales_lead_segments.lead_id
        and (l.created_by = auth.uid() or p.role = any (array['admin','director']))
    )
  );

-- 2) Adicionar cidade no lead
alter table public.sales_leads
  add column if not exists city_id uuid references public.site_cities(id);

create index if not exists sales_leads_city_id_idx on public.sales_leads (city_id);

-- 3) Migrar dados existentes do campo segment_id (legado) para a tabela de junção
insert into public.sales_lead_segments (lead_id, segment_id, created_by)
select id, segment_id, created_by
from public.sales_leads
where segment_id is not null
on conflict do nothing;
  