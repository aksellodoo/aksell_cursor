-- Fix existing data: Clear is_new_record for records not from the latest sync
-- Simple approach: clear all is_new_record flags that don't have a recent last_sync_id

UPDATE protheus_sa3010_fc3d70f6 
SET is_new_record = false
WHERE is_new_record = true 
  AND (last_sync_id IS NULL OR last_synced_at < NOW() - INTERVAL '1 hour');

-- Ensure records with pending_deletion have correct record_status  
UPDATE protheus_sa3010_fc3d70f6 
SET record_status = 'deleted'::protheus_record_status
WHERE pending_deletion = true AND (record_status IS NULL OR record_status != 'deleted');