-- Direct DDL approach to add columns to specific tables
-- Add to protheus_sa1010_80f17f00
ALTER TABLE IF EXISTS public.protheus_sa1010_80f17f00 
ADD COLUMN IF NOT EXISTS pending_deletion BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE IF EXISTS public.protheus_sa1010_80f17f00 
ADD COLUMN IF NOT EXISTS pending_deletion_at TIMESTAMPTZ;

-- Add to protheus_sa3010_fc3d70f6  
ALTER TABLE IF EXISTS public.protheus_sa3010_fc3d70f6 
ADD COLUMN IF NOT EXISTS pending_deletion BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE IF EXISTS public.protheus_sa3010_fc3d70f6 
ADD COLUMN IF NOT EXISTS pending_deletion_at TIMESTAMPTZ;

-- Add to protheus_sa4010_ea26a13a
ALTER TABLE IF EXISTS public.protheus_sa4010_ea26a13a 
ADD COLUMN IF NOT EXISTS pending_deletion BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE IF EXISTS public.protheus_sa4010_ea26a13a 
ADD COLUMN IF NOT EXISTS pending_deletion_at TIMESTAMPTZ;

-- Add to protheus_sa5010_7d6a8fff
ALTER TABLE IF EXISTS public.protheus_sa5010_7d6a8fff 
ADD COLUMN IF NOT EXISTS pending_deletion BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE IF EXISTS public.protheus_sa5010_7d6a8fff 
ADD COLUMN IF NOT EXISTS pending_deletion_at TIMESTAMPTZ;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_protheus_sa1010_80f17f00_pending_deletion ON public.protheus_sa1010_80f17f00 (pending_deletion);
CREATE INDEX IF NOT EXISTS idx_protheus_sa3010_fc3d70f6_pending_deletion ON public.protheus_sa3010_fc3d70f6 (pending_deletion);
CREATE INDEX IF NOT EXISTS idx_protheus_sa4010_ea26a13a_pending_deletion ON public.protheus_sa4010_ea26a13a (pending_deletion);
CREATE INDEX IF NOT EXISTS idx_protheus_sa5010_7d6a8fff_pending_deletion ON public.protheus_sa5010_7d6a8fff (pending_deletion);