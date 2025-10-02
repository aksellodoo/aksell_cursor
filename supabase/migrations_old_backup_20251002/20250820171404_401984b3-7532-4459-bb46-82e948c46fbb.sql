-- Add pending_deletion column to the protheus table
ALTER TABLE protheus_sa3010_fc3d70f6 
ADD COLUMN IF NOT EXISTS pending_deletion boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS pending_deletion_at timestamptz NULL;

-- Clear is_new_record for records that are not from the latest sync
UPDATE protheus_sa3010_fc3d70f6 
SET is_new_record = false
WHERE is_new_record = true 
  AND (last_sync_id != '47776c19-6f40-4deb-ae4c-20d5d4e9fa08' OR last_sync_id IS NULL);

-- Update generated column for record_status to include deleted status
ALTER TABLE protheus_sa3010_fc3d70f6 
DROP COLUMN IF EXISTS record_status;

ALTER TABLE protheus_sa3010_fc3d70f6 
ADD COLUMN record_status protheus_record_status 
GENERATED ALWAYS AS (
  CASE 
    WHEN pending_deletion THEN 'deleted'::protheus_record_status
    WHEN is_new_record THEN 'new'::protheus_record_status
    WHEN was_updated_last_sync THEN 'updated'::protheus_record_status
    ELSE 'unchanged'::protheus_record_status
  END
) STORED;