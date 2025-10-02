-- Add allow_delete column to folders table
-- This field controls whether a folder can be deleted from the system

-- Add column with default true (all existing folders remain deletable)
ALTER TABLE public.folders
ADD COLUMN IF NOT EXISTS allow_delete BOOLEAN NOT NULL DEFAULT true;

-- Create index for performance when filtering by allow_delete
CREATE INDEX IF NOT EXISTS idx_folders_allow_delete
ON public.folders(allow_delete);

-- Add comment explaining the field
COMMENT ON COLUMN public.folders.allow_delete IS
'Determines if this folder can be deleted. If false, folder is protected from deletion across the entire system.';
