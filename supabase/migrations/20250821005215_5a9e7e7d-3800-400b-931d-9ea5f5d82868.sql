-- Migração pontual para SA3010 - Fix soft delete columns
BEGIN;

-- 1) Colunas de soft delete
ALTER TABLE public.protheus_sa3010_fc3d70f6
  ADD COLUMN IF NOT EXISTS pending_deletion boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pending_deletion_at timestamptz;

-- 2) Índice parcial (útil para filtros)
CREATE INDEX IF NOT EXISTS protheus_sa3010_fc3d70f6_pending_del_idx
  ON public.protheus_sa3010_fc3d70f6 (pending_deletion) WHERE pending_deletion;

-- 3) Atualizar o JSON de estrutura da tabela dinâmica
UPDATE protheus_dynamic_tables t
SET table_structure = jsonb_set(
  t.table_structure,
  '{columns}',
  (
    SELECT jsonb_agg(DISTINCT c)
    FROM jsonb_array_elements(
           coalesce(t.table_structure->'columns','[]'::jsonb)
           || jsonb_build_array(
                jsonb_build_object('name','pending_deletion','type','boolean'),
                jsonb_build_object('name','pending_deletion_at','type','timestamptz')
              )
         ) AS c
  ),
  true
)
WHERE t.id = 'fc3d70f6-97ce-4997-967a-8fd92e615f99';

-- 4) Backfill correto (usa supabase_table_name)
UPDATE public.protheus_sa3010_fc3d70f6 t
SET pending_deletion = true,
    pending_deletion_at = COALESCE(t.pending_deletion_at, d.deleted_at)
FROM public.protheus_sync_deletions d
WHERE d.supabase_table_name = 'protheus_sa3010_fc3d70f6'
  AND d.protheus_id = t.protheus_id
  AND t.pending_deletion IS DISTINCT FROM true;

-- 5) RPC seguro para futuras tabelas
CREATE OR REPLACE FUNCTION public.ensure_soft_delete_columns(
  _table regclass,
  _supabase_table_name text
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  s text; r text; idx_name text; updated int := 0;
BEGIN
  -- restringe a public.protheus_*
  SELECT n.nspname, c.relname
    INTO s, r
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE c.oid = _table;
  IF s <> 'public' OR r !~ '^protheus_' THEN
    RAISE EXCEPTION 'table % is not allowed', _table::text;
  END IF;

  -- criar colunas e índice
  EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS pending_deletion boolean NOT NULL DEFAULT false', _table);
  EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS pending_deletion_at timestamptz', _table);
  idx_name := replace(_table::text,'.','_')||'_pending_del_idx';
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %s (pending_deletion) WHERE pending_deletion', idx_name, _table);

  -- backfill (usa supabase_table_name)
  EXECUTE format($q$
    UPDATE %s t
       SET pending_deletion = true,
           pending_deletion_at = COALESCE(t.pending_deletion_at, d.deleted_at)
      FROM public.protheus_sync_deletions d
     WHERE d.supabase_table_name = %L
       AND d.protheus_id = t.protheus_id
       AND t.pending_deletion IS DISTINCT FROM true
  $q$, _table, _supabase_table_name);

  GET DIAGNOSTICS updated = ROW_COUNT;

  PERFORM pg_notify('pgrst','reload schema');
  RETURN updated;
END $$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.ensure_soft_delete_columns(regclass, text) TO authenticated;

-- Helper function to check if column exists
CREATE OR REPLACE FUNCTION public.column_exists(
  schemaname text,
  tablename text,
  columnname text
) RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = schemaname
      AND table_name = tablename
      AND column_name = columnname
  );
$$;

GRANT EXECUTE ON FUNCTION public.column_exists(text, text, text) TO authenticated;

-- 6) Recarregar cache do PostgREST
SELECT pg_notify('pgrst','reload schema');

COMMIT;