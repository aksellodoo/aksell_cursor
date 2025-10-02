
-- 1) Tabela de vínculo entre grupo econômico e segmentos do site
create table if not exists public.economic_group_segments_map (
  id uuid primary key default gen_random_uuid(),
  group_id integer not null references public.protheus_customer_groups(id_grupo) on delete cascade,
  segment_id uuid not null references public.site_product_segments(id),
  created_by uuid not null,
  created_at timestamptz not null default now()
);

-- Evitar duplicidade do mesmo segmento no mesmo grupo
create unique index if not exists idx_unique_group_segment on public.economic_group_segments_map (group_id, segment_id);

-- Índices para filtros usuais
create index if not exists idx_egsm_group_id on public.economic_group_segments_map (group_id);
create index if not exists idx_egsm_segment_id on public.economic_group_segments_map (segment_id);

-- 2) Ativar RLS
alter table public.economic_group_segments_map enable row level security;

-- 3) Políticas RLS
-- Leitura: qualquer usuário autenticado pode ler
drop policy if exists "Economic group segments viewable by authenticated" on public.economic_group_segments_map;
create policy "Economic group segments viewable by authenticated"
  on public.economic_group_segments_map
  for select
  to authenticated
  using (true);

-- Inserção: criador ou admins/diretores
drop policy if exists "Economic group segments insert by owner or admins" on public.economic_group_segments_map;
create policy "Economic group segments insert by owner or admins"
  on public.economic_group_segments_map
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['admin','director'])
    )
  );

-- Exclusão: criador ou admins/diretores
drop policy if exists "Economic group segments delete by owner or admins" on public.economic_group_segments_map;
create policy "Economic group segments delete by owner or admins"
  on public.economic_group_segments_map
  for delete
  to authenticated
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['admin','director'])
    )
  );

-- Observação: Não criamos política de UPDATE pois a tabela é de mapeamento (inserir/remover).
