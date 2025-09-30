-- Fix security warnings by setting search_path for functions
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix search_path for soft delete function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;