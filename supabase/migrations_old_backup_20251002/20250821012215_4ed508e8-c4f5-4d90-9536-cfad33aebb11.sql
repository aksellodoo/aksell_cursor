-- Step 1: Kill the event trigger by OID
BEGIN;
DELETE FROM pg_event_trigger WHERE oid = 59784;
COMMIT;

-- Step 2: Drop the function itself
DROP FUNCTION IF EXISTS public.auto_setup_protheus_table() RESTRICT;

-- Step 3: Sanity checks (should return 0 rows)
SELECT 1 FROM pg_event_trigger WHERE oid = 59784;
SELECT 1 FROM pg_proc WHERE proname='auto_setup_protheus_table';

-- Step 4: SA3010 hotfix
BEGIN;
ALTER TABLE public.protheus_sa3010_fc3d70f6
  ADD COLUMN IF NOT EXISTS pending_deletion boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pending_deletion_at timestamptz;
CREATE INDEX IF NOT EXISTS protheus_sa3010_fc3d70f6_pending_del_idx
  ON public.protheus_sa3010_fc3d70f6 (pending_deletion) WHERE pending_deletion;
UPDATE protheus_dynamic_tables t
SET table_structure = jsonb_set(
  t.table_structure,'{columns}',
  (SELECT jsonb_agg(DISTINCT c)
   FROM jsonb_array_elements(
     coalesce(t.table_structure->'columns','[]'::jsonb)
     || jsonb_build_array(
          jsonb_build_object('name','pending_deletion','type','boolean'),
          jsonb_build_object('name','pending_deletion_at','type','timestamptz')
        )
   ) AS c), true)
WHERE t.id = 'fc3d70f6-97ce-4997-967a-8fd92e615f99';
UPDATE public.protheus_sa3010_fc3d70f6 t
SET pending_deletion = true,
    pending_deletion_at = COALESCE(t.pending_deletion_at, d.deleted_at)
FROM public.protheus_sync_deletions d
WHERE d.supabase_table_name = 'protheus_sa3010_fc3d70f6'
  AND d.protheus_id = t.protheus_id
  AND t.pending_deletion IS DISTINCT FROM true;
SELECT pg_notify('pgrst','reload schema');
COMMIT;