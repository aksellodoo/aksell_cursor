
-- 2 & 3) Garantias de unicidade e limpeza automática de grupos vazios,
-- além de manter a flag has_economic_group sempre consistente.

-- 2.1) Criar índice único SOMENTE se ainda não existir algum índice/constraint único
-- sobre a coluna unified_supplier_id na tabela purchases_economic_group_members
DO $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.contype = 'u'
      AND n.nspname = 'public'
      AND t.relname = 'purchases_economic_group_members'
      AND c.conkey = ARRAY[
        (
          SELECT attnum
          FROM pg_attribute
          WHERE attrelid = t.oid
            AND attname = 'unified_supplier_id'
        )
      ]
  ) INTO v_exists;

  IF NOT v_exists THEN
    -- Caso não exista uma uniqueness nessa coluna, criaremos um índice único.
    EXECUTE 'CREATE UNIQUE INDEX uq_purchases_group_member_unified
             ON public.purchases_economic_group_members (unified_supplier_id)';
  END IF;
END $$;

-- 2.2) Trigger para sincronizar a flag has_economic_group em purchases_unified_suppliers
CREATE OR REPLACE FUNCTION public.tg_sync_purchases_unified_has_group()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Marca o fornecedor como pertencente a algum grupo
    UPDATE public.purchases_unified_suppliers
       SET has_economic_group = true
     WHERE id = NEW.unified_supplier_id;
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Se trocou o fornecedor, ajustar ambos (antigo/novo)
    IF NEW.unified_supplier_id IS DISTINCT FROM OLD.unified_supplier_id THEN
      -- Antigo: se ficou sem vínculos, seta false
      IF NOT EXISTS (
        SELECT 1
        FROM public.purchases_economic_group_members
        WHERE unified_supplier_id = OLD.unified_supplier_id
      ) THEN
        UPDATE public.purchases_unified_suppliers
           SET has_economic_group = false
         WHERE id = OLD.unified_supplier_id;
      END IF;

      -- Novo: garantir true
      UPDATE public.purchases_unified_suppliers
         SET has_economic_group = true
       WHERE id = NEW.unified_supplier_id;

    ELSE
      -- Mesmo fornecedor; garantir true
      UPDATE public.purchases_unified_suppliers
         SET has_economic_group = true
       WHERE id = NEW.unified_supplier_id;
    END IF;

    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    -- Se o fornecedor apagado ficou sem vínculos, seta false
    IF NOT EXISTS (
      SELECT 1
      FROM public.purchases_economic_group_members
      WHERE unified_supplier_id = OLD.unified_supplier_id
    ) THEN
      UPDATE public.purchases_unified_suppliers
         SET has_economic_group = false
       WHERE id = OLD.unified_supplier_id;
    END IF;

    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Criar um único trigger para INSERT/UPDATE/DELETE
DROP TRIGGER IF EXISTS trg_sync_purchases_unified_has_group_aiud ON public.purchases_economic_group_members;
CREATE TRIGGER trg_sync_purchases_unified_has_group_aiud
AFTER INSERT OR UPDATE OR DELETE ON public.purchases_economic_group_members
FOR EACH ROW
EXECUTE FUNCTION public.tg_sync_purchases_unified_has_group();

-- 3) Trigger para apagar grupos que ficarem vazios
CREATE OR REPLACE FUNCTION public.tg_cleanup_empty_purchases_group()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_group_id integer;
  v_remaining integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_group_id := OLD.group_id;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Só interessa quando mudou o grupo
    IF NEW.group_id IS DISTINCT FROM OLD.group_id THEN
      v_group_id := OLD.group_id;
    ELSE
      RETURN NEW;
    END IF;

  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COUNT(*) INTO v_remaining
  FROM public.purchases_economic_group_members
  WHERE group_id = v_group_id;

  IF v_remaining = 0 THEN
    DELETE FROM public.purchases_economic_groups
    WHERE id_grupo = v_group_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Triggers: após DELETE e após UPDATE (quando muda o group_id)
DROP TRIGGER IF EXISTS trg_cleanup_empty_purchases_group_ad ON public.purchases_economic_group_members;
CREATE TRIGGER trg_cleanup_empty_purchases_group_ad
AFTER DELETE ON public.purchases_economic_group_members
FOR EACH ROW
EXECUTE FUNCTION public.tg_cleanup_empty_purchases_group();

DROP TRIGGER IF EXISTS trg_cleanup_empty_purchases_group_au ON public.purchases_economic_group_members;
CREATE TRIGGER trg_cleanup_empty_purchases_group_au
AFTER UPDATE OF group_id ON public.purchases_economic_group_members
FOR EACH ROW
EXECUTE FUNCTION public.tg_cleanup_empty_purchases_group();

-- 2.3) Backfill: garantir consistência imediata do has_economic_group
UPDATE public.purchases_unified_suppliers us
SET has_economic_group = EXISTS (
  SELECT 1
  FROM public.purchases_economic_group_members m
  WHERE m.unified_supplier_id = us.id
);
