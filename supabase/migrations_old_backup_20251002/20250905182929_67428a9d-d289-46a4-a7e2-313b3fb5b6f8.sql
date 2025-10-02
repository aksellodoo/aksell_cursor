
-- 1) Atualizar create_missing_unified_suppliers para copiar Comprador
CREATE OR REPLACE FUNCTION public.create_missing_unified_suppliers()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_inserted_potential integer := 0;
  v_inserted_sa2010 integer := 0;
  v_linked_sa2010 integer := 0;
  v_inserted_sa2010_from_potential integer := 0;
  v_inserted_sa2010_pure integer := 0;
  v_union_sa2010 text;
begin
  -- União dinâmica de todas SA2010
  select string_agg(
    format(
      'select 
         a2_filial::text as a2_filial, 
         a2_cod::text    as a2_cod, 
         a2_loja::text   as a2_loja, 
         a2_nome::text   as a2_nome, 
         a2_nreduz::text as a2_nreduz, 
         a2_cgc::text    as a2_cgc 
       from %I',
      supabase_table_name
    ),
    ' union all '
  )
  into v_union_sa2010
  from public.protheus_dynamic_tables
  where supabase_table_name like 'protheus_sa2010%';

  if v_union_sa2010 is null then
    v_union_sa2010 := 'select 
                         null::text as a2_filial, 
                         null::text as a2_cod, 
                         null::text as a2_loja, 
                         null::text as a2_nome, 
                         null::text as a2_nreduz, 
                         null::text as a2_cgc 
                       where false';
  end if;

  -- 1) Inserir Potenciais sem unificado (agora copiando Comprador)
  with src as (
    select
      p.id as potential_id,
      p.cnpj,
      p.created_by,
      p.assigned_buyer_cod,
      p.assigned_buyer_filial
    from public.purchases_potential_suppliers p
    left join public.purchases_unified_suppliers u on u.potential_supplier_id = p.id
    where u.id is null
  )
  insert into public.purchases_unified_suppliers 
    (potential_supplier_id, cnpj, created_by, assigned_buyer_cod, assigned_buyer_filial)
  select potential_id, cnpj, created_by, assigned_buyer_cod, assigned_buyer_filial
  from src;

  get diagnostics v_inserted_potential = row_count;

  -- 2) SA2010: Vincular por CNPJ a unificado existente de Potencial (merge) quando possível
  execute format($q$
    with sa as (%s),
    sa_key as (
      select 
        a2_filial::text as filial,
        a2_cod::text    as cod,
        a2_loja::text   as loja,
        a2_cgc::text    as cnpj
      from sa
    ),
    to_process as (
      select s.*
      from sa_key s
      left join public.purchases_unified_suppliers u
        on u.protheus_filial = s.filial
       and u.protheus_cod    = s.cod
       and u.protheus_loja   = s.loja
      where u.id is null
    ),
    normalized as (
      select 
        t.*,
        regexp_replace(coalesce(t.cnpj,''), '[^0-9]', '', 'g') as cnpj_digits
      from to_process t
    ),
    potentials as (
      select 
        p.id as potential_id,
        p.created_by as potential_created_by,
        regexp_replace(coalesce(p.cnpj,''), '[^0-9]', '', 'g') as cnpj_digits
      from public.purchases_potential_suppliers p
    ),
    match_potential as (
      select 
        n.filial, n.cod, n.loja, n.cnpj, n.cnpj_digits,
        pot.potential_id
      from normalized n
      left join potentials pot
        on pot.cnpj_digits <> ''
       and pot.cnpj_digits = n.cnpj_digits
    ),
    pot_unified as (
      select 
        mp.*,
        u.id as unified_id
      from match_potential mp
      left join public.purchases_unified_suppliers u
        on u.potential_supplier_id = mp.potential_id
    )
    update public.purchases_unified_suppliers u
       set protheus_filial = p.filial,
           protheus_cod    = p.cod,
           protheus_loja   = p.loja,
           cnpj            = coalesce(u.cnpj, p.cnpj)
     from pot_unified p
    where p.unified_id is not null
      and u.id = p.unified_id
      and (u.protheus_filial is null or u.protheus_cod is null or u.protheus_loja is null)
  $q$, v_union_sa2010);

  get diagnostics v_linked_sa2010 = row_count;

  -- 3) SA2010: Inserir unificado vinculado ao Potencial quando não houver unificado daquele Potencial (copiando Comprador)
  execute format($q$
    with sa as (%s),
    sa_key as (
      select 
        a2_filial::text as filial,
        a2_cod::text    as cod,
        a2_loja::text   as loja,
        a2_cgc::text    as cnpj
      from sa
    ),
    to_process as (
      select s.*
      from sa_key s
      left join public.purchases_unified_suppliers u
        on u.protheus_filial = s.filial
       and u.protheus_cod    = s.cod
       and u.protheus_loja   = s.loja
      where u.id is null
    ),
    normalized as (
      select 
        t.*,
        regexp_replace(coalesce(t.cnpj,''), '[^0-9]', '', 'g') as cnpj_digits
      from to_process t
    ),
    potentials as (
      select 
        p.id as potential_id,
        p.created_by as potential_created_by,
        p.assigned_buyer_cod,
        p.assigned_buyer_filial,
        regexp_replace(coalesce(p.cnpj,''), '[^0-9]', '', 'g') as cnpj_digits
      from public.purchases_potential_suppliers p
    ),
    match_potential as (
      select 
        n.filial, n.cod, n.loja, n.cnpj,
        pot.potential_id, pot.potential_created_by, pot.assigned_buyer_cod, pot.assigned_buyer_filial
      from normalized n
      join potentials pot
        on pot.cnpj_digits <> ''
       and pot.cnpj_digits = n.cnpj_digits
    ),
    pot_without_unified as (
      select mp.*
      from match_potential mp
      left join public.purchases_unified_suppliers u
        on u.potential_supplier_id = mp.potential_id
      where u.id is null
    )
    insert into public.purchases_unified_suppliers
      (potential_supplier_id, protheus_filial, protheus_cod, protheus_loja, cnpj, created_by, assigned_buyer_cod, assigned_buyer_filial)
    select 
      p.potential_id, p.filial, p.cod, p.loja, p.cnpj, p.potential_created_by, p.assigned_buyer_cod, p.assigned_buyer_filial
    from pot_without_unified p
  $q$, v_union_sa2010);

  get diagnostics v_inserted_sa2010_from_potential = row_count;

  -- 4) SA2010: Inserir unificados "puros" (sem Potencial compatível por CNPJ)
  execute format($q$
    with sa as (%s),
    sa_key as (
      select 
        a2_filial::text as filial,
        a2_cod::text    as cod,
        a2_loja::text   as loja,
        a2_cgc::text    as cnpj
      from sa
    ),
    to_process as (
      select s.*
      from sa_key s
      left join public.purchases_unified_suppliers u
        on u.protheus_filial = s.filial
       and u.protheus_cod    = s.cod
       and u.protheus_loja   = s.loja
      where u.id is null
    ),
    normalized as (
      select 
        t.*,
        regexp_replace(coalesce(t.cnpj,''), '[^0-9]', '', 'g') as cnpj_digits
      from to_process t
    ),
    potentials as (
      select 
        regexp_replace(coalesce(p.cnpj,''), '[^0-9]', '', 'g') as cnpj_digits
      from public.purchases_potential_suppliers p
    ),
    no_match as (
      select n.*
      from normalized n
      left join potentials pot
        on pot.cnpj_digits <> ''
       and pot.cnpj_digits = n.cnpj_digits
      where pot.cnpj_digits is null
    )
    insert into public.purchases_unified_suppliers 
      (protheus_filial, protheus_cod, protheus_loja, cnpj)
    select filial, cod, loja, cnpj
    from no_match
  $q$, v_union_sa2010);

  get diagnostics v_inserted_sa2010_pure = row_count;

  v_inserted_sa2010 := v_inserted_sa2010_from_potential + v_inserted_sa2010_pure;

  return json_build_object(
    'success', true,
    'inserted_potential', v_inserted_potential,
    'inserted_sa2010', v_inserted_sa2010,
    'linked_sa2010', v_linked_sa2010
  );
end;
$function$;

-- 2) Gatilhos para sincronizar Comprador designado

-- 2.1) Unificado -> Potencial
CREATE OR REPLACE FUNCTION public.tg_sync_buyer_from_unified_to_potential()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.potential_supplier_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT'
     OR COALESCE(NEW.assigned_buyer_cod,'') IS DISTINCT FROM COALESCE(OLD.assigned_buyer_cod,'')
     OR COALESCE(NEW.assigned_buyer_filial,'') IS DISTINCT FROM COALESCE(OLD.assigned_buyer_filial,'')
  THEN
    UPDATE public.purchases_potential_suppliers
       SET assigned_buyer_cod     = NEW.assigned_buyer_cod,
           assigned_buyer_filial  = NEW.assigned_buyer_filial,
           updated_at             = now()
     WHERE id = NEW.potential_supplier_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_buyer_from_unified_to_potential ON public.purchases_unified_suppliers;
CREATE TRIGGER trg_sync_buyer_from_unified_to_potential
AFTER INSERT OR UPDATE OF assigned_buyer_cod, assigned_buyer_filial ON public.purchases_unified_suppliers
FOR EACH ROW
EXECUTE FUNCTION public.tg_sync_buyer_from_unified_to_potential();

-- 2.2) Potencial -> Unificado
CREATE OR REPLACE FUNCTION public.tg_sync_buyer_from_potential_to_unified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    UPDATE public.purchases_unified_suppliers u
       SET assigned_buyer_cod    = NEW.assigned_buyer_cod,
           assigned_buyer_filial = NEW.assigned_buyer_filial,
           updated_at            = now()
     WHERE u.potential_supplier_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_buyer_from_potential_to_unified ON public.purchases_potential_suppliers;
CREATE TRIGGER trg_sync_buyer_from_potential_to_unified
AFTER UPDATE OF assigned_buyer_cod, assigned_buyer_filial ON public.purchases_potential_suppliers
FOR EACH ROW
EXECUTE FUNCTION public.tg_sync_buyer_from_potential_to_unified();

-- 3) Gatilho para copiar Tipos de Material do Potencial para o Grupo quando o grupo for definido
CREATE OR REPLACE FUNCTION public.tg_copy_potential_material_types_to_group()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (COALESCE(OLD.economic_group_id::text,'') IS DISTINCT FROM COALESCE(NEW.economic_group_id::text,''))
     AND NEW.economic_group_id IS NOT NULL
     AND NEW.potential_supplier_id IS NOT NULL
  THEN
    INSERT INTO public.purchases_supplier_group_material_types (group_id, material_type_id, created_by)
    SELECT NEW.economic_group_id, pmt.material_type_id, COALESCE(NEW.created_by, auth.uid())
      FROM public.purchases_potential_supplier_material_types pmt
     WHERE pmt.supplier_id = NEW.potential_supplier_id
       AND NOT EXISTS (
         SELECT 1 
           FROM public.purchases_supplier_group_material_types g
          WHERE g.group_id = NEW.economic_group_id
            AND g.material_type_id = pmt.material_type_id
       );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_copy_potential_material_types_to_group ON public.purchases_unified_suppliers;
CREATE TRIGGER trg_copy_potential_material_types_to_group
AFTER UPDATE OF economic_group_id ON public.purchases_unified_suppliers
FOR EACH ROW
EXECUTE FUNCTION public.tg_copy_potential_material_types_to_group();
