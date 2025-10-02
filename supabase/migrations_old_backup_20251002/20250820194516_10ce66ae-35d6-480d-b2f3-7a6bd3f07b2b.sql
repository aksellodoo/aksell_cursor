-- 1) Função: garante colunas de soft delete e índice em TODAS as tabelas public.protheus_%
CREATE OR REPLACE FUNCTION public.ensure_soft_delete_columns_for_all_protheus()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r record;
  processed_count int := 0;
  added_count int := 0;
BEGIN
  FOR r IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name LIKE 'protheus\_%' ESCAPE '\'
  LOOP
    processed_count := processed_count + 1;

    -- Add pending_deletion
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS pending_deletion boolean NOT NULL DEFAULT FALSE', r.table_name);
    added_count := added_count + 1;

    -- Add pending_deletion_at
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS pending_deletion_at timestamptz NULL', r.table_name);
    added_count := added_count + 1;

    -- Index
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (pending_deletion)', r.table_name || '_pending_deletion_idx', r.table_name);
  END LOOP;

  RETURN json_build_object(
    'status', 'ok',
    'processed_tables', processed_count,
    'ddl_operations_attempted', added_count
  );
END;
$$;

-- 2) Função: faz backfill usando public.protheus_sync_deletions
-- Marca registros como pending_deletion = TRUE e define pending_deletion_at
CREATE OR REPLACE FUNCTION public.backfill_pending_deletions_for_all_protheus()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  d record;
  updated_total bigint := 0;
  updated_rows bigint;
BEGIN
  FOR d IN
    SELECT supabase_table_name, protheus_id, deleted_at
    FROM public.protheus_sync_deletions
  LOOP
    -- Garante que a tabela alvo realmente existe em public
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = d.supabase_table_name
    ) THEN
      EXECUTE format(
        'UPDATE public.%I
         SET pending_deletion = TRUE,
             pending_deletion_at = $1
         WHERE protheus_id = $2',
        d.supabase_table_name
      )
      USING d.deleted_at, d.protheus_id;

      GET DIAGNOSTICS updated_rows = ROW_COUNT;
      updated_total := updated_total + COALESCE(updated_rows, 0);
    END IF;
  END LOOP;

  RETURN json_build_object(
    'status', 'ok',
    'updated_rows', updated_total
  );
END;
$$;

-- 3) Executa as funções acima agora (idempotente)
SELECT public.ensure_soft_delete_columns_for_all_protheus();
SELECT public.backfill_pending_deletions_for_all_protheus();