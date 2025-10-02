
-- 1) Tornar os triggers de sincronização de comprador SECURITY DEFINER e normalizar entradas

CREATE OR REPLACE FUNCTION public.tg_sync_buyer_unified_to_potential()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  -- Só sincroniza se houver potencial vinculado
  if new.potential_supplier_id is null then
    return new;
  end if;

  -- Sincroniza em INSERT ou quando houver mudança em qualquer um dos campos
  if tg_op = 'INSERT'
     or coalesce(btrim(new.assigned_buyer_cod),'') is distinct from coalesce(btrim(old.assigned_buyer_cod),'')
     or coalesce(btrim(new.assigned_buyer_filial),'') is distinct from coalesce(btrim(old.assigned_buyer_filial),'')
  then
    update public.purchases_potential_suppliers
       set assigned_buyer_cod    = nullif(btrim(new.assigned_buyer_cod), ''),
           assigned_buyer_filial = nullif(btrim(new.assigned_buyer_filial), ''),
           updated_at            = now()
     where id = new.potential_supplier_id;
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.tg_sync_buyer_from_unified_to_potential()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Só sincroniza se houver potencial vinculado
  IF NEW.potential_supplier_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Sincroniza em INSERT ou quando houver mudança em qualquer um dos campos
  IF TG_OP = 'INSERT'
     OR COALESCE(btrim(NEW.assigned_buyer_cod),'') IS DISTINCT FROM COALESCE(btrim(OLD.assigned_buyer_cod),'')
     OR COALESCE(btrim(NEW.assigned_buyer_filial),'') IS DISTINCT FROM COALESCE(btrim(OLD.assigned_buyer_filial),'')
  THEN
    UPDATE public.purchases_potential_suppliers
       SET assigned_buyer_cod    = nullif(btrim(NEW.assigned_buyer_cod), ''),
           assigned_buyer_filial = nullif(btrim(NEW.assigned_buyer_filial), ''),
           updated_at            = now()
     WHERE id = NEW.potential_supplier_id;
  END IF;

  RETURN NEW;
END;
$function$;
