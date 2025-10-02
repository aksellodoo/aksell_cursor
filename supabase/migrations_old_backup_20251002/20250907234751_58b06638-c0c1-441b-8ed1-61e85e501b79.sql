
-- RPC: Retorna Nome Fantasia (a1_nreduz) e Razão Social (a1_nome) para um unified_id,
-- unindo dinamicamente todas as SA1010 e fazendo fallback em sales_leads.
create or replace function public.get_unified_account_names(p_unified_id uuid)
returns table(
  trade_name text,
  legal_name text,
  protheus_filial text,
  protheus_cod text,
  protheus_loja text
)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_union_sa1 text;
begin
  -- Monta a união de todas as SA1010 dinâmicas
  select string_agg(
    format(
      'select 
         a1_filial::text as a1_filial,
         a1_cod::text    as a1_cod,
         a1_loja::text   as a1_loja,
         a1_nreduz::text as a1_nreduz,
         a1_nome::text   as a1_nome
       from %I',
       supabase_table_name
    ),
    ' union all '
  )
  into v_union_sa1
  from public.protheus_dynamic_tables
  where supabase_table_name like 'protheus_sa1010%';

  if v_union_sa1 is null then
    v_union_sa1 := 'select 
                      null::text as a1_filial,
                      null::text as a1_cod,
                      null::text as a1_loja,
                      null::text as a1_nreduz,
                      null::text as a1_nome
                    where false';
  end if;

  return query execute format($q$
    with sa1_all as (
      %s
    )
    select
      -- Linha 1 (prioridade Fantasia/Reduzido do Protheus)
      coalesce(sa1.a1_nreduz, sl.trade_name, sa1.a1_nome, sl.legal_name) as trade_name,
      -- Linha 2 (prioridade Razão Social do Protheus)
      coalesce(sa1.a1_nome,   sl.legal_name, sa1.a1_nreduz, sl.trade_name) as legal_name,
      ua.protheus_filial::text,
      ua.protheus_cod::text,
      ua.protheus_loja::text
    from public.unified_accounts ua
    left join sa1_all sa1
      on sa1.a1_filial = ua.protheus_filial::text
     and sa1.a1_cod    = ua.protheus_cod::text
     and sa1.a1_loja   = ua.protheus_loja::text
    left join public.sales_leads sl
      on sl.id = ua.lead_id
    where ua.id = %L
    limit 1
  $q$, v_union_sa1, p_unified_id);
end;
$$;
