-- Add soft delete support to workflows table
ALTER TABLE public.workflows 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN can_be_deleted BOOLEAN DEFAULT true;

-- Add index for better performance on deleted workflows
CREATE INDEX idx_workflows_deleted_at ON public.workflows(deleted_at);

-- Function to check if workflow can be safely deleted
CREATE OR REPLACE FUNCTION public.can_delete_workflow(workflow_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  execution_count INTEGER;
  queue_count INTEGER;
  task_count INTEGER;
BEGIN
  -- Check for executions
  SELECT COUNT(*) INTO execution_count
  FROM public.workflow_executions 
  WHERE workflow_id = workflow_id_param;
  
  -- Check for queued executions
  SELECT COUNT(*) INTO queue_count
  FROM public.workflow_queue 
  WHERE workflow_id = workflow_id_param;
  
  -- Check for workflow-generated tasks
  SELECT COUNT(*) INTO task_count
  FROM public.tasks 
  WHERE workflow_id = workflow_id_param;
  
  -- Can delete if no executions, queue items, or tasks exist
  RETURN (execution_count = 0 AND queue_count = 0 AND task_count = 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to soft delete workflow
CREATE OR REPLACE FUNCTION public.soft_delete_workflow(workflow_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Mark workflow as deleted
  UPDATE public.workflows 
  SET 
    deleted_at = NOW(),
    is_active = false,
    status = 'deleted'
  WHERE id = workflow_id_param;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;