
-- 1) Garantir que o enum tenha o valor 'deleted' (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'protheus_record_status'
      AND e.enumlabel = 'deleted'
  ) THEN
    ALTER TYPE protheus_record_status ADD VALUE 'deleted';
  END IF;
END $$;

-- 2) Garantir que a coluna gerada record_status exista (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'protheus_sa3010_fc3d70f6'
      AND column_name = 'record_status'
  ) THEN
    ALTER TABLE public.protheus_sa3010_fc3d70f6
    ADD COLUMN record_status protheus_record_status
    GENERATED ALWAYS AS (
      CASE
        WHEN is_new_record = true THEN 'new'::protheus_record_status
        WHEN was_updated_last_sync = true THEN 'updated'::protheus_record_status
        ELSE 'unchanged'::protheus_record_status
      END
    ) STORED;
  END IF;
END $$;

-- 3) Criar o trigger para emitir eventos de mudança (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
      AND event_object_table = 'protheus_sa3010_fc3d70f6'
      AND trigger_name = 'protheus_sa3010_fc3d70f6_status_change_trigger'
  ) THEN
    CREATE TRIGGER protheus_sa3010_fc3d70f6_status_change_trigger
      AFTER INSERT OR UPDATE ON public.protheus_sa3010_fc3d70f6
      FOR EACH ROW
      EXECUTE FUNCTION public.emit_protheus_status_change();
  END IF;
END $$;
