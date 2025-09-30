-- Fix the problematic trigger and add pending_deletion columns

-- First, drop the problematic event trigger if it exists
DROP EVENT TRIGGER IF EXISTS auto_setup_protheus_table_trigger;

-- Drop the function that has the bug
DROP FUNCTION IF EXISTS auto_setup_protheus_table();

-- Now add the missing columns to SA3010 table
ALTER TABLE public.protheus_sa3010_fc3d70f6 
ADD COLUMN pending_deletion BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN pending_deletion_at TIMESTAMPTZ NULL;

-- Add missing columns to other tables
ALTER TABLE public.protheus_sa1010_80f17f00 
ADD COLUMN pending_deletion BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN pending_deletion_at TIMESTAMPTZ NULL;

ALTER TABLE public.protheus_sa4010_ea26a13a
ADD COLUMN pending_deletion BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN pending_deletion_at TIMESTAMPTZ NULL;

ALTER TABLE public.protheus_sa5010_7d6a8fff
ADD COLUMN pending_deletion BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN pending_deletion_at TIMESTAMPTZ NULL;

-- Create indexes
CREATE INDEX protheus_sa3010_fc3d70f6_pending_deletion_idx ON public.protheus_sa3010_fc3d70f6 (pending_deletion);
CREATE INDEX protheus_sa1010_80f17f00_pending_deletion_idx ON public.protheus_sa1010_80f17f00 (pending_deletion);
CREATE INDEX protheus_sa4010_ea26a13a_pending_deletion_idx ON public.protheus_sa4010_ea26a13a (pending_deletion);
CREATE INDEX protheus_sa5010_7d6a8fff_pending_deletion_idx ON public.protheus_sa5010_7d6a8fff (pending_deletion);

-- Backfill SA3010 deletion data (this should mark 000006 as deleted)
UPDATE public.protheus_sa3010_fc3d70f6
SET pending_deletion = TRUE, 
    pending_deletion_at = psd.created_at
FROM public.protheus_sync_deletions psd
WHERE psd.supabase_table_name = 'protheus_sa3010_fc3d70f6'
AND protheus_sa3010_fc3d70f6.protheus_id = psd.protheus_id;