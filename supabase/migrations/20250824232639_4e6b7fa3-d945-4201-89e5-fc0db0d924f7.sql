
-- Update the folders table status enum to include 'hidden' status
ALTER TYPE folder_status ADD VALUE IF NOT EXISTS 'hidden';

-- Update the constraint to allow 'hidden' status
ALTER TABLE folders DROP CONSTRAINT IF EXISTS folders_status_check;
ALTER TABLE folders ADD CONSTRAINT folders_status_check CHECK (status IN ('active', 'archived', 'hidden'));
