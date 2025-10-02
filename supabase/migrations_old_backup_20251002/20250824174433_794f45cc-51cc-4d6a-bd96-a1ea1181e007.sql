-- Step 3: Apply the new foreign key constraints with proper CASCADE/SET NULL behavior

-- Fix tasks table constraints
DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix workflows table constraints  
DROP CONSTRAINT IF EXISTS workflows_created_by_fkey;
ALTER TABLE public.workflows
  ADD CONSTRAINT workflows_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix record_shares table - CASCADE delete shares when user is deleted
DROP CONSTRAINT IF EXISTS record_shares_shared_by_fkey;
ALTER TABLE public.record_shares
  ADD CONSTRAINT record_shares_shared_by_fkey 
    FOREIGN KEY (shared_by) REFERENCES auth.users(id) ON DELETE CASCADE;

DROP CONSTRAINT IF EXISTS record_shares_shared_with_fkey;
ALTER TABLE public.record_shares
  ADD CONSTRAINT record_shares_shared_with_fkey 
    FOREIGN KEY (shared_with) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix workflow_approvals table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_approvals') THEN
    ALTER TABLE public.workflow_approvals
      DROP CONSTRAINT IF EXISTS workflow_approvals_approver_id_fkey,
      ADD CONSTRAINT workflow_approvals_approver_id_fkey 
        FOREIGN KEY (approver_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Fix form_responses submitted_by
DROP CONSTRAINT IF EXISTS form_responses_submitted_by_fkey;
ALTER TABLE public.form_responses
  ADD CONSTRAINT form_responses_submitted_by_fkey 
    FOREIGN KEY (submitted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix chatter_files uploaded_by
DROP CONSTRAINT IF EXISTS chatter_files_uploaded_by_fkey;
ALTER TABLE public.chatter_files
  ADD CONSTRAINT chatter_files_uploaded_by_fkey 
    FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix approval_tokens table
DROP CONSTRAINT IF EXISTS approval_tokens_created_by_fkey;
ALTER TABLE public.approval_tokens
  ADD CONSTRAINT approval_tokens_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

DROP CONSTRAINT IF EXISTS approval_tokens_used_by_fkey;
ALTER TABLE public.approval_tokens
  ADD CONSTRAINT approval_tokens_used_by_fkey 
    FOREIGN KEY (used_by) REFERENCES auth.users(id) ON DELETE SET NULL;