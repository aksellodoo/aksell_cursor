
BEGIN;

-- 1) Garantir ON DELETE SET NULL em profiles.created_by
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_created_by_fkey;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES auth.users(id)
    ON DELETE SET NULL;

-- 2) Ajustar access_rejections.rejected_by para aceitar NULL e apontar para profiles com ON DELETE SET NULL
ALTER TABLE public.access_rejections
  ALTER COLUMN rejected_by DROP NOT NULL;

ALTER TABLE public.access_rejections
  DROP CONSTRAINT IF EXISTS access_rejections_rejected_by_fkey;

ALTER TABLE public.access_rejections
  ADD CONSTRAINT access_rejections_rejected_by_fkey
    FOREIGN KEY (rejected_by)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;

-- 3) Ajustar protheus_tables.created_by para aceitar NULL e ON DELETE SET NULL
ALTER TABLE public.protheus_tables
  ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE public.protheus_tables
  DROP CONSTRAINT IF EXISTS protheus_tables_created_by_fkey;

ALTER TABLE public.protheus_tables
  ADD CONSTRAINT protheus_tables_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES auth.users(id)
    ON DELETE SET NULL;

-- 4) Ajustes condicionais nas tabelas Protheus auxiliares, se existirem

DO $$
BEGIN
  -- protheus_dynamic_tables.created_by -> ON DELETE SET NULL (se existir)
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'protheus_dynamic_tables'
      AND column_name = 'created_by'
  ) THEN
    EXECUTE '
      ALTER TABLE public.protheus_dynamic_tables
        DROP CONSTRAINT IF EXISTS protheus_dynamic_tables_created_by_fkey;
      ALTER TABLE public.protheus_dynamic_tables
        ADD CONSTRAINT protheus_dynamic_tables_created_by_fkey
          FOREIGN KEY (created_by)
          REFERENCES auth.users(id)
          ON DELETE SET NULL
    ';
  END IF;

  -- protheus_sync_logs.executed_by -> ON DELETE SET NULL (se existir)
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'protheus_sync_logs'
      AND column_name = 'executed_by'
  ) THEN
    EXECUTE '
      ALTER TABLE public.protheus_sync_logs
        DROP CONSTRAINT IF EXISTS protheus_sync_logs_executed_by_fkey;
      ALTER TABLE public.protheus_sync_logs
        ADD CONSTRAINT protheus_sync_logs_executed_by_fkey
          FOREIGN KEY (executed_by)
          REFERENCES auth.users(id)
          ON DELETE SET NULL
    ';
  END IF;
END $$;

COMMIT;
