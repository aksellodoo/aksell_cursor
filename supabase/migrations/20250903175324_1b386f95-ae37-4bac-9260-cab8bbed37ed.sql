
-- 1) Tipos (Enums) - criar se não existirem
do $$
begin
  if not exists (select 1 from pg_type where typname = 'supplier_source_channel') then
    create type public.supplier_source_channel as enum (
      'indicacao_referencia',
      'pesquisa_propria',
      'abordagem_proativa',
      'base_interna',
      'outros'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'supplier_source_subchannel') then
    create type public.supplier_source_subchannel as enum (
      -- Indicação / Referência
      'indicacao_cliente',
      'indicacao_fornecedor_atual',
      'parceiro_consultor',
      'funcionario_interno',
      'outro_contato',
      -- Pesquisa Própria
      'google_internet',
      'feira_evento',
      'associacao_sindicato_entidade',
      'plataforma_b2b_marketplace',
      'linkedin_rede_profissional',
      'visita_tecnica_viagem',
      -- Abordagem Proativa
      'contato_direto_fornecedor',
      'prospeccao_comercial',
      -- Base Interna
      'banco_dados_historico',
      'fornecedor_homologado_outra_unidade_grupo',
      'documentos_tecnicos_projetos_antigos',
      -- Outros
      'origem_nao_especificada',
      'outro_especificar'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'material_supply_type') then
    create type public.material_supply_type as enum (
      'materias_primas',
      'embalagens',
      'indiretos',
      'transportadora',
      'servicos'
    );
  end if;
end$$;

-- 2) Tabela principal
create table if not exists public.purchases_potential_suppliers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null,

  trade_name text not null,
  legal_name text,
  cnpj text,
  website text,

  city_id uuid references public.site_cities(id),

  -- Comprador designado (Protheus SY1010)
  assigned_buyer_cod text,
  assigned_buyer_filial text,

  -- Tipos de material fornecido (multi)
  material_types public.material_supply_type[] not null default '{}',

  -- Origem
  source_channel public.supplier_source_channel,
  source_subchannel public.supplier_source_subchannel,
  source_detail text
);

-- 3) Gatilho de updated_at
drop trigger if exists set_updated_at_on_purchases_potential_suppliers on public.purchases_potential_suppliers;
create trigger set_updated_at_on_purchases_potential_suppliers
before update on public.purchases_potential_suppliers
for each row
execute function public.set_current_timestamp_updated_at();

-- 4) Normalização de CNPJ
drop trigger if exists normalize_cnpj_on_purchases_potential_suppliers on public.purchases_potential_suppliers;
create trigger normalize_cnpj_on_purchases_potential_suppliers
before insert or update on public.purchases_potential_suppliers
for each row
execute function public.tg_normalize_cnpj();

-- 5) Validação da origem (detalhe obrigatório em certas combinações)
create or replace function public.purchases_suppliers_validate_source()
returns trigger
language plpgsql
as $function$
begin
  -- Detalhe obrigatório se canal = Indicação/Referência
  if new.source_channel = 'indicacao_referencia' then
    if new.source_detail is null or btrim(new.source_detail) = '' then
      raise exception 'source_detail is required when source_channel = indicacao_referencia';
    end if;
  end if;

  -- Detalhe obrigatório se canal = Outros e subcanal = Outro (especificar)
  if new.source_channel = 'outros' and new.source_subchannel = 'outro_especificar' then
    if new.source_detail is null or btrim(new.source_detail) = '' then
      raise exception 'source_detail is required when source_channel = outros and source_subchannel = outro_especificar';
    end if;
  end if;

  return new;
end;
$function$;

drop trigger if exists validate_source_on_purchases_potential_suppliers on public.purchases_potential_suppliers;
create trigger validate_source_on_purchases_potential_suppliers
before insert or update on public.purchases_potential_suppliers
for each row
execute function public.purchases_suppliers_validate_source();

-- 6) RLS e políticas
alter table public.purchases_potential_suppliers enable row level security;

-- SELECT: qualquer usuário autenticado
drop policy if exists "Potential suppliers viewable by authenticated" on public.purchases_potential_suppliers;
create policy "Potential suppliers viewable by authenticated"
  on public.purchases_potential_suppliers
  for select
  using (true);

-- INSERT: dono (created_by) ou admins/diretores
drop policy if exists "Potential suppliers insert by owner or admins" on public.purchases_potential_suppliers;
create policy "Potential suppliers insert by owner or admins"
  on public.purchases_potential_suppliers
  for insert
  with check (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','director')
    )
  );

-- UPDATE: dono (created_by) ou admins/diretores
drop policy if exists "Potential suppliers update by owner or admins" on public.purchases_potential_suppliers;
create policy "Potential suppliers update by owner or admins"
  on public.purchases_potential_suppliers
  for update
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

-- DELETE: dono (created_by) ou admins/diretores
drop policy if exists "Potential suppliers delete by owner or admins" on public.purchases_potential_suppliers;
create policy "Potential suppliers delete by owner or admins"
  on public.purchases_potential_suppliers
  for delete
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','director')
    )
  );

-- 7) Índices úteis
create index if not exists idx_purch_ps_trade_name on public.purchases_potential_suppliers using btree (trade_name);
create index if not exists idx_purch_ps_cnpj on public.purchases_potential_suppliers using btree (cnpj);
create index if not exists idx_purch_ps_city_id on public.purchases_potential_suppliers using btree (city_id);
create index if not exists idx_purch_ps_created_by on public.purchases_potential_suppliers using btree (created_by);
