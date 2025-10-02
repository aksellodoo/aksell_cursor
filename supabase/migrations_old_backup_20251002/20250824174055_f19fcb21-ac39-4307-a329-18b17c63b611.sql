-- Fix remaining foreign key constraints that prevent user deletion
-- Only modify existing columns and constraints

-- 1. Fix tasks table constraints
ALTER TABLE public.tasks 
  ALTER COLUMN created_by DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS tasks_created_by_fkey,
  ADD CONSTRAINT tasks_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Fix workflows table constraints  
ALTER TABLE public.workflows
  ALTER COLUMN created_by DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS workflows_created_by_fkey,
  ADD CONSTRAINT workflows_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Fix record_shares table - CASCADE delete shares when user is deleted
ALTER TABLE public.record_shares
  DROP CONSTRAINT IF EXISTS record_shares_shared_by_fkey,
  ADD CONSTRAINT record_shares_shared_by_fkey 
    FOREIGN KEY (shared_by) REFERENCES auth.users(id) ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS record_shares_shared_with_fkey,
  ADD CONSTRAINT record_shares_shared_with_fkey 
    FOREIGN KEY (shared_with) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Fix workflow_approvals table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_approvals') THEN
    ALTER TABLE public.workflow_approvals
      DROP CONSTRAINT IF EXISTS workflow_approvals_approver_id_fkey,
      ADD CONSTRAINT workflow_approvals_approver_id_fkey 
        FOREIGN KEY (approver_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 5. Fix workflow_corrections table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_corrections') THEN
    ALTER TABLE public.workflow_corrections
      DROP CONSTRAINT IF EXISTS workflow_corrections_requested_by_fkey,
      ADD CONSTRAINT workflow_corrections_requested_by_fkey 
        FOREIGN KEY (requested_by) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 6. Fix workflow_executions table if started_by column exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'workflow_executions' AND column_name = 'started_by') THEN
    ALTER TABLE public.workflow_executions
      ALTER COLUMN started_by DROP NOT NULL,
      DROP CONSTRAINT IF EXISTS workflow_executions_started_by_fkey,
      ADD CONSTRAINT workflow_executions_started_by_fkey 
        FOREIGN KEY (started_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 7. Fix form_responses submitted_by (already nullable, just fix constraint)
ALTER TABLE public.form_responses
  DROP CONSTRAINT IF EXISTS form_responses_submitted_by_fkey,
  ADD CONSTRAINT form_responses_submitted_by_fkey 
    FOREIGN KEY (submitted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 8. Fix chatter_files uploaded_by
ALTER TABLE public.chatter_files
  DROP CONSTRAINT IF EXISTS chatter_files_uploaded_by_fkey,
  ADD CONSTRAINT chatter_files_uploaded_by_fkey 
    FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 9. Fix approval_tokens table
ALTER TABLE public.approval_tokens
  DROP CONSTRAINT IF EXISTS approval_tokens_created_by_fkey,
  ADD CONSTRAINT approval_tokens_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS approval_tokens_used_by_fkey,
  ADD CONSTRAINT approval_tokens_used_by_fkey 
    FOREIGN KEY (used_by) REFERENCES auth.users(id) ON DELETE SET NULL;