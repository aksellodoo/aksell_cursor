-- SQL hotfix para SA3010 - adicionar colunas de soft delete
BEGIN;

-- 1) Colunas de soft delete na tabela dinâmica da SA3010
ALTER TABLE public.protheus_sa3010_fc3d70f6
  ADD COLUMN IF NOT EXISTS pending_deletion boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pending_deletion_at timestamptz;

-- Índice parcial (opcional mas recomendável)
CREATE INDEX IF NOT EXISTS protheus_sa3010_fc3d70f6_pending_del_idx
  ON public.protheus_sa3010_fc3d70f6 (pending_deletion) WHERE pending_deletion;

-- 2) Atualizar a estrutura dinâmica (ajuste o ID se necessário)
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

-- 3) Backfill a partir do log de deleções (se existir)
UPDATE public.protheus_sa3010_fc3d70f6 t
SET pending_deletion = true,
    pending_deletion_at = COALESCE(t.pending_deletion_at, d.deleted_at)
FROM public.protheus_sync_deletions d
WHERE d.table_name = 'SA3010'
  AND d.protheus_id = t.protheus_id
  AND NOT t.pending_deletion;

-- 4) Forçar recarga do schema do PostgREST
NOTIFY pgrst, 'reload schema';

COMMIT;