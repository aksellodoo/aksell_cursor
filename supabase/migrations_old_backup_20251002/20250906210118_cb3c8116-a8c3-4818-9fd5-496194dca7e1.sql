
-- 1) Adiciona coluna de flag
ALTER TABLE public.purchases_unified_suppliers
ADD COLUMN IF NOT EXISTS has_economic_group boolean NOT NULL DEFAULT false;

-- 2) Backfill inicial com base na tabela de membros
UPDATE public.purchases_unified_suppliers us
SET has_economic_group = EXISTS (
  SELECT 1
  FROM public.purchases_economic_group_members m
  WHERE m.unified_supplier_id = us.id
);

-- 3) Função de trigger para manter o flag sincronizado
CREATE OR REPLACE FUNCTION public.tg_sync_unified_supplier_has_group()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.unified_supplier_id IS NOT NULL THEN
      UPDATE public.purchases_unified_suppliers
      SET has_economic_group = true, updated_at = now()
      WHERE id = NEW.unified_supplier_id;
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.unified_supplier_id IS NOT NULL THEN
      UPDATE public.purchases_unified_suppliers
      SET has_economic_group = EXISTS (
        SELECT 1 FROM public.purchases_economic_group_members m
        WHERE m.unified_supplier_id = OLD.unified_supplier_id
      ), updated_at = now()
      WHERE id = OLD.unified_supplier_id;
    END IF;
    RETURN OLD;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Se o unified_supplier_id mudou, liga o novo e recalcula o antigo
    IF NEW.unified_supplier_id IS DISTINCT FROM OLD.unified_supplier_id THEN
      IF NEW.unified_supplier_id IS NOT NULL THEN
        UPDATE public.purchases_unified_suppliers
        SET has_economic_group = true, updated_at = now()
        WHERE id = NEW.unified_supplier_id;
      END IF;

      IF OLD.unified_supplier_id IS NOT NULL THEN
        UPDATE public.purchases_unified_suppliers
        SET has_economic_group = EXISTS (
          SELECT 1 FROM public.purchases_economic_group_members m
          WHERE m.unified_supplier_id = OLD.unified_supplier_id
        ), updated_at = now()
        WHERE id = OLD.unified_supplier_id;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4) Triggers em purchases_economic_group_members
DROP TRIGGER IF EXISTS trg_sync_has_group_ins ON public.purchases_economic_group_members;
DROP TRIGGER IF EXISTS trg_sync_has_group_del ON public.purchases_economic_group_members;
DROP TRIGGER IF EXISTS trg_sync_has_group_upd ON public.purchases_economic_group_members;

CREATE TRIGGER trg_sync_has_group_ins
AFTER INSERT ON public.purchases_economic_group_members
FOR EACH ROW
EXECUTE FUNCTION public.tg_sync_unified_supplier_has_group();

CREATE TRIGGER trg_sync_has_group_del
AFTER DELETE ON public.purchases_economic_group_members
FOR EACH ROW
EXECUTE FUNCTION public.tg_sync_unified_supplier_has_group();

CREATE TRIGGER trg_sync_has_group_upd
AFTER UPDATE OF unified_supplier_id, group_id ON public.purchases_economic_group_members
FOR EACH ROW
EXECUTE FUNCTION public.tg_sync_unified_supplier_has_group();

-- 5) Índice para acelerar o filtro
CREATE INDEX IF NOT EXISTS idx_pus_has_economic_group
ON public.purchases_unified_suppliers(has_economic_group);
