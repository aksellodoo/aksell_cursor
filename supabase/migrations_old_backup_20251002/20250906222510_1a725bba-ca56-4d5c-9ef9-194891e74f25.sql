
-- Conta potenciais fornecedores que ainda não possuem fornecedor unificado
create or replace function public.count_potential_without_unified()
returns integer
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from public.purchases_potential_suppliers ps
  left join public.purchases_unified_suppliers us
    on us.potential_supplier_id = ps.id
  where us.id is null;

  return v_count;
end;
$$;
