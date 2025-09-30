
-- 1) Fortalecer a sincronização Potencial -> Unificado:
--    - SECURITY DEFINER
--    - SET search_path
--    - Atualizar somente quando houver mudança real
--    - Normalizar strings vazias para NULL

CREATE OR REPLACE FUNCTION public.tg_sync_buyer_from_potential_to_unified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF COALESCE(btrim(NEW.assigned_buyer_cod),'') IS DISTINCT FROM COALESCE(btrim(OLD.assigned_buyer_cod),'')
       OR COALESCE(btrim(NEW.assigned_buyer_filial),'') IS DISTINCT FROM COALESCE(btrim(OLD.assigned_buyer_filial),'') THEN
      UPDATE public.purchases_unified_suppliers u
         SET assigned_buyer_cod    = NULLIF(btrim(NEW.assigned_buyer_cod), ''),
             assigned_buyer_filial = NULLIF(btrim(NEW.assigned_buyer_filial), ''),
             updated_at            = now()
       WHERE u.potential_supplier_id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- 2) Remover trigger redundante no Potencial -> Unificado
DROP TRIGGER IF EXISTS trg_sync_buyer_potential_to_unified ON public.purchases_potential_suppliers;

-- 3) Remover trigger duplicado (BEFORE) no Unificado -> Potencial
--    Mantemos apenas o AFTER (trg_sync_buyer_from_unified_to_potential),
--    que já cobre INSERT/UPDATE dos campos do comprador.
DROP TRIGGER IF EXISTS trg_sync_buyer_unified_to_potential ON public.purchases_unified_suppliers;
