-- Add pending_deletion columns to specific dynamic Protheus tables

-- Add columns to protheus_sa1010_80f17f00
ALTER TABLE public.protheus_sa1010_80f17f00 
ADD COLUMN IF NOT EXISTS pending_deletion BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pending_deletion_at TIMESTAMPTZ NULL;

-- Add columns to protheus_sa3010_fc3d70f6  
ALTER TABLE public.protheus_sa3010_fc3d70f6
ADD COLUMN IF NOT EXISTS pending_deletion BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pending_deletion_at TIMESTAMPTZ NULL;

-- Add columns to protheus_sa4010_ea26a13a
ALTER TABLE public.protheus_sa4010_ea26a13a
ADD COLUMN IF NOT EXISTS pending_deletion BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pending_deletion_at TIMESTAMPTZ NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS protheus_sa1010_80f17f00_pending_deletion_idx ON public.protheus_sa1010_80f17f00 (pending_deletion);
CREATE INDEX IF NOT EXISTS protheus_sa3010_fc3d70f6_pending_deletion_idx ON public.protheus_sa3010_fc3d70f6 (pending_deletion);
CREATE INDEX IF NOT EXISTS protheus_sa4010_ea26a13a_pending_deletion_idx ON public.protheus_sa4010_ea26a13a (pending_deletion);

-- Backfill SA1010 deletion data
UPDATE public.protheus_sa1010_80f17f00 
SET pending_deletion = TRUE, 
    pending_deletion_at = psd.created_at
FROM public.protheus_sync_deletions psd
WHERE psd.supabase_table_name = 'protheus_sa1010_80f17f00'
AND protheus_sa1010_80f17f00.protheus_id = psd.protheus_id
AND protheus_sa1010_80f17f00.pending_deletion = FALSE;

-- Backfill SA3010 deletion data  
UPDATE public.protheus_sa3010_fc3d70f6
SET pending_deletion = TRUE, 
    pending_deletion_at = psd.created_at
FROM public.protheus_sync_deletions psd
WHERE psd.supabase_table_name = 'protheus_sa3010_fc3d70f6'
AND protheus_sa3010_fc3d70f6.protheus_id = psd.protheus_id
AND protheus_sa3010_fc3d70f6.pending_deletion = FALSE;

-- Backfill SA4010 deletion data
UPDATE public.protheus_sa4010_ea26a13a
SET pending_deletion = TRUE, 
    pending_deletion_at = psd.created_at
FROM public.protheus_sync_deletions psd
WHERE psd.supabase_table_name = 'protheus_sa4010_ea26a13a'
AND protheus_sa4010_ea26a13a.protheus_id = psd.protheus_id
AND protheus_sa4010_ea26a13a.pending_deletion = FALSE;