-- Clean up orphaned references and fix foreign key constraints

-- Step 1: Clean up orphaned data first
UPDATE public.form_responses 
SET submitted_by = NULL 
WHERE submitted_by IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = submitted_by);

UPDATE public.chatter_files 
SET uploaded_by = NULL 
WHERE uploaded_by IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = uploaded_by);

UPDATE public.tasks 
SET created_by = NULL 
WHERE created_by IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = created_by);

UPDATE public.workflows 
SET created_by = NULL 
WHERE created_by IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = created_by);

-- Step 2: Delete orphaned record shares
DELETE FROM public.record_shares 
WHERE shared_by IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = shared_by);

DELETE FROM public.record_shares 
WHERE shared_with IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = shared_with);

-- Step 3: Delete orphaned workflow approvals if table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_approvals') THEN
    DELETE FROM public.workflow_approvals 
    WHERE approver_id IS NOT NULL 
      AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = approver_id);
  END IF;
END $$;

-- Step 4: Delete orphaned approval tokens
DELETE FROM public.approval_tokens 
WHERE created_by IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = created_by);

UPDATE public.approval_tokens 
SET used_by = NULL 
WHERE used_by IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = used_by);