
-- 1) Tabela de vínculo N:N entre potenciais fornecedores e tags
create table if not exists public.purchases_potential_supplier_tags (
  supplier_id uuid not null references public.purchases_potential_suppliers(id) on delete cascade,
  tag_id uuid not null references public.email_tags(id) on delete cascade,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  primary key (supplier_id, tag_id)
);

-- 2) Habilitar RLS
alter table public.purchases_potential_supplier_tags enable row level security;

-- 3) Políticas de acesso
-- Leitura: qualquer usuário autenticado
create policy "Supplier tag links viewable by authenticated"
  on public.purchases_potential_supplier_tags
  for select
  using (true);

-- Inserção: apenas criador
create policy "Supplier tag links insertable by creator"
  on public.purchases_potential_supplier_tags
  for insert
  with check (created_by = auth.uid());

-- Remoção: criador ou admin/diretor
create policy "Supplier tag links deletable by creator or admins"
  on public.purchases_potential_supplier_tags
  for delete
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin','director')
    )
  );

-- (Opcional) Não permitiremos UPDATE; para trocar tags remover e inserir novamente.

-- 4) Índices auxiliares
create index if not exists idx_pst_supplier on public.purchases_potential_supplier_tags (supplier_id);
create index if not exists idx_pst_tag on public.purchases_potential_supplier_tags (tag_id);
