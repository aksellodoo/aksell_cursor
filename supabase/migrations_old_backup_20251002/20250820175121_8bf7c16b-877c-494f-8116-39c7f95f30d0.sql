
-- 1) Adiciona pending_deletion e pending_deletion_at em TODAS as tabelas dinâmicas do Protheus
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT supabase_table_name
    FROM public.protheus_dynamic_tables
  LOOP
    -- Adicionar colunas se não existirem
    EXECUTE format('ALTER TABLE IF EXISTS public.%I ADD COLUMN IF NOT EXISTS pending_deletion boolean NOT NULL DEFAULT false;', r.supabase_table_name);
    EXECUTE format('ALTER TABLE IF EXISTS public.%I ADD COLUMN IF NOT EXISTS pending_deletion_at timestamptz NULL;', r.supabase_table_name);

    -- Índice para filtros rápidos
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_pending_deletion ON public.%I (pending_deletion);', r.supabase_table_name, r.supabase_table_name);
  END LOOP;
END $$;

-- 2) Backfill: marca pending_deletion nas linhas que já constam em protheus_sync_deletions
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT supabase_table_name
    FROM public.protheus_sync_deletions
  LOOP
    -- Atualiza registros existentes naquela tabela dinâmica com base nos protheus_id deletados
    EXECUTE format(
      $sql$
      UPDATE public.%1$I t
      SET pending_deletion = true,
          pending_deletion_at = d.deleted_at
      FROM public.protheus_sync_deletions d
      WHERE d.supabase_table_name = %2$L
        AND t.protheus_id = d.protheus_id
        AND (t.pending_deletion IS DISTINCT FROM true);
      $sql$,
      r.supabase_table_name,
      r.supabase_table_name
    );
  END LOOP;
END $$;
