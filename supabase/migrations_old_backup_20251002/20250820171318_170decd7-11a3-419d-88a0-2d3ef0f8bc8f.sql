-- Simple fix: just clear all is_new_record flags for old records in the specific table
UPDATE protheus_sa3010_fc3d70f6 
SET is_new_record = false
WHERE is_new_record = true 
  AND (last_synced_at IS NULL OR last_synced_at < NOW() - INTERVAL '24 hours');

-- Also clear any wrong statuses
UPDATE protheus_sa3010_fc3d70f6 
SET record_status = 'deleted'::protheus_record_status
WHERE pending_deletion = true;