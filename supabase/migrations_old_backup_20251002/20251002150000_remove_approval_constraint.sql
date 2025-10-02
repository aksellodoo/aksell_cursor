-- Remove constraint that requires approvers and approval_mode fields
-- These fields are redundant since we already have task assignment (assigned_to, assigned_users)

ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS chk_tasks_approval_min;

-- The approval logic will use the task assignment fields instead:
-- - assigned_to: single approver
-- - assigned_users: multiple approvers
-- - assigned_department: all users in department are approvers
