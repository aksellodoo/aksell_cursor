-- Manually add pending_deletion to SA3010 to fix the badge issue
ALTER TABLE public.protheus_sa3010_fc3d70f6 ADD COLUMN pending_deletion BOOLEAN NOT NULL DEFAULT FALSE;