
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Para cada tabela dinâmica Protheus
  FOR r IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name LIKE 'protheus\_%'
  LOOP
    -- 1) Criar colunas de soft-delete, se ainda não existirem
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS pending_deletion boolean NOT NULL DEFAULT false;', r.table_name);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS pending_deletion_at timestamptz NULL;', r.table_name);

    -- 2) Índices úteis (idempotentes)
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (pending_deletion);', r.table_name || '_pending_deletion_idx', r.table_name);
    -- Muitas operações usam protheus_id para correlacionar com logs de deleção
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (protheus_id);', r.table_name || '_protheus_id_idx', r.table_name);

    -- 3) Backfill: marcar como pending_deletion com base no histórico (protheus_sync_deletions)
    -- Observação: assumimos que protheus_sync_deletions tem colunas (supabase_table_name, protheus_id, created_at)
    EXECUTE format($sql$
      UPDATE public.%I AS t
         SET pending_deletion = true,
             pending_deletion_at = COALESCE(t.pending_deletion_at, d.created_at)
      FROM public.protheus_sync_deletions d
      WHERE d.supabase_table_name = %L
        AND d.protheus_id = t.protheus_id;
    $sql$, r.table_name, r.table_name);
  END LOOP;
END $$;
