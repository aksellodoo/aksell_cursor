
-- 1) Tabela de cidades do site
create table if not exists public.site_cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,                         -- NOME DO MUNICÍPIO
  cod_munic text not null,                    -- COD. MUNIC (IBGE do município)
  cod_uf text not null,                       -- COD. UF (IBGE da UF)
  uf text not null,                           -- UF (sigla, ex: SP)
  population_est_2021 integer,                -- POPULAÇÃO ESTIMADA em 2021
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid                             -- opcional: id do criador (profiles.id), sem FK para simplificar
);

-- 2) Índices
create unique index if not exists uq_site_cities_cod_munic on public.site_cities (cod_munic);
create index if not exists idx_site_cities_name on public.site_cities (name);
create index if not exists idx_site_cities_uf on public.site_cities (uf);

-- 3) RLS
alter table public.site_cities enable row level security;

-- SELECT: autenticados podem visualizar
drop policy if exists "site_cities_select_authenticated" on public.site_cities;
create policy "site_cities_select_authenticated"
  on public.site_cities
  for select
  using (true);

-- INSERT: apenas admin/diretor
drop policy if exists "site_cities_insert_admins_directors" on public.site_cities;
create policy "site_cities_insert_admins_directors"
  on public.site_cities
  for insert
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('admin','director')
    )
  );

-- UPDATE: apenas admin/diretor
drop policy if exists "site_cities_update_admins_directors" on public.site_cities;
create policy "site_cities_update_admins_directors"
  on public.site_cities
  for update
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('admin','director')
    )
  )
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('admin','director')
    )
  );

-- DELETE: apenas admin/diretor
drop policy if exists "site_cities_delete_admins_directors" on public.site_cities;
create policy "site_cities_delete_admins_directors"
  on public.site_cities
  for delete
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('admin','director')
    )
  );

-- 4) Trigger de updated_at (usa função genérica já existente: public.tg_set_updated_at)
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'tg_site_cities_set_updated_at'
  ) then
    create trigger tg_site_cities_set_updated_at
    before update on public.site_cities
    for each row execute function public.tg_set_updated_at();
  end if;
end$$;
