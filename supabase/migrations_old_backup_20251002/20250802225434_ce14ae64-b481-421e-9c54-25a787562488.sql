-- Remove the old version of process_access_request_approval function that uses individual parameters
-- This will eliminate the function overloading conflict

DROP FUNCTION IF EXISTS public.process_access_request_approval(
  request_id UUID,
  approved BOOLEAN,
  rejection_reason TEXT,
  supervisor_id UUID,
  edited_role TEXT,
  edited_department TEXT,
  edited_department_id UUID,
  edited_notification_types JSONB
);

-- Ensure only the version with edited_data JSONB parameter exists
-- This function was already created in the previous migration but let's make sure it's the only one