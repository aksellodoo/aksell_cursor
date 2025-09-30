-- Disable the problematic event trigger first
ALTER EVENT TRIGGER protheus_table_auto_setup DISABLE;

-- Now add the missing columns to SA3010 table  
ALTER TABLE public.protheus_sa3010_fc3d70f6 
ADD COLUMN pending_deletion BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN pending_deletion_at TIMESTAMPTZ NULL;

-- Add missing columns to other Protheus tables
ALTER TABLE public.protheus_sa1010_80f17f00 
ADD COLUMN pending_deletion BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN pending_deletion_at TIMESTAMPTZ NULL;

ALTER TABLE public.protheus_sa4010_ea26a13a
ADD COLUMN pending_deletion BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN pending_deletion_at TIMESTAMPTZ NULL;

ALTER TABLE public.protheus_sa5010_7d6a8fff
ADD COLUMN pending_deletion BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN pending_deletion_at TIMESTAMPTZ NULL;

-- Create indexes for better query performance
CREATE INDEX protheus_sa3010_fc3d70f6_pending_deletion_idx ON public.protheus_sa3010_fc3d70f6 (pending_deletion);
CREATE INDEX protheus_sa1010_80f17f00_pending_deletion_idx ON public.protheus_sa1010_80f17f00 (pending_deletion);
CREATE INDEX protheus_sa4010_ea26a13a_pending_deletion_idx ON public.protheus_sa4010_ea26a13a (pending_deletion);
CREATE INDEX protheus_sa5010_7d6a8fff_pending_deletion_idx ON public.protheus_sa5010_7d6a8fff (pending_deletion);

-- Backfill SA3010 with deletion data (this should mark record 000006 as deleted)
UPDATE public.protheus_sa3010_fc3d70f6
SET pending_deletion = TRUE, 
    pending_deletion_at = psd.created_at
FROM public.protheus_sync_deletions psd
WHERE psd.supabase_table_name = 'protheus_sa3010_fc3d70f6'
AND protheus_sa3010_fc3d70f6.protheus_id = psd.protheus_id;

-- Re-enable the event trigger (fixed the function bug by using object_type instead of object_name)
CREATE OR REPLACE FUNCTION auto_setup_protheus_table() 
RETURNS event_trigger AS $$
DECLARE
    obj record;
BEGIN
    FOR obj IN SELECT schema_name, object_identity
        FROM pg_event_trigger_ddl_commands()
        WHERE object_type = 'table'
          AND schema_name = 'public'
          AND object_identity LIKE 'public.protheus_%'
    LOOP
        -- Add any auto-setup logic here if needed
        RAISE NOTICE 'Protheus table created: %', obj.object_identity;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Re-enable the event trigger
ALTER EVENT TRIGGER protheus_table_auto_setup ENABLE;