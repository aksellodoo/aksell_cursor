-- Adicionar colunas pending_deletion em todas as tabelas Protheus existentes
ALTER TABLE public.protheus_sa1010_80f17f00 ADD COLUMN IF NOT EXISTS pending_deletion boolean NOT NULL DEFAULT FALSE;
ALTER TABLE public.protheus_sa1010_80f17f00 ADD COLUMN IF NOT EXISTS pending_deletion_at timestamptz NULL;
CREATE INDEX IF NOT EXISTS protheus_sa1010_80f17f00_pending_deletion_idx ON public.protheus_sa1010_80f17f00 (pending_deletion);

ALTER TABLE public.protheus_sa3010_fc3d70f6 ADD COLUMN IF NOT EXISTS pending_deletion boolean NOT NULL DEFAULT FALSE;
ALTER TABLE public.protheus_sa3010_fc3d70f6 ADD COLUMN IF NOT EXISTS pending_deletion_at timestamptz NULL;
CREATE INDEX IF NOT EXISTS protheus_sa3010_fc3d70f6_pending_deletion_idx ON public.protheus_sa3010_fc3d70f6 (pending_deletion);

ALTER TABLE public.protheus_sa4010_ea26a13a ADD COLUMN IF NOT EXISTS pending_deletion boolean NOT NULL DEFAULT FALSE;
ALTER TABLE public.protheus_sa4010_ea26a13a ADD COLUMN IF NOT EXISTS pending_deletion_at timestamptz NULL;
CREATE INDEX IF NOT EXISTS protheus_sa4010_ea26a13a_pending_deletion_idx ON public.protheus_sa4010_ea26a13a (pending_deletion);

ALTER TABLE public.protheus_sa5010_7d6a8fff ADD COLUMN IF NOT EXISTS pending_deletion boolean NOT NULL DEFAULT FALSE;
ALTER TABLE public.protheus_sa5010_7d6a8fff ADD COLUMN IF NOT EXISTS pending_deletion_at timestamptz NULL;
CREATE INDEX IF NOT EXISTS protheus_sa5010_7d6a8fff_pending_deletion_idx ON public.protheus_sa5010_7d6a8fff (pending_deletion);

-- Fazer backfill dos dados de exclusão usando protheus_sync_deletions
UPDATE public.protheus_sa3010_fc3d70f6 
SET pending_deletion = TRUE, pending_deletion_at = psd.deleted_at
FROM public.protheus_sync_deletions psd
WHERE psd.supabase_table_name = 'protheus_sa3010_fc3d70f6' 
  AND psd.protheus_id = protheus_sa3010_fc3d70f6.protheus_id;