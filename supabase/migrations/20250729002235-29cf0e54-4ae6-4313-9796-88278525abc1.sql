-- Create workflow approvals table
CREATE TABLE public.workflow_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_execution_id UUID NOT NULL,
  step_id TEXT NOT NULL,
  approver_id UUID NOT NULL,
  status approval_status NOT NULL DEFAULT 'pending',
  comments TEXT,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approval_data JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMP WITH TIME ZONE,
  priority TEXT NOT NULL DEFAULT 'medium'
);

-- Enable RLS
ALTER TABLE public.workflow_approvals ENABLE ROW LEVEL SECURITY;

-- Create policies for workflow approvals
CREATE POLICY "Users can view approvals assigned to them or that they created"
ON public.workflow_approvals 
FOR SELECT 
USING (
  approver_id = auth.uid() OR 
  approved_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.workflow_executions we 
    WHERE we.id = workflow_execution_id AND we.triggered_by = auth.uid()
  )
);

CREATE POLICY "Users can update approvals assigned to them"
ON public.workflow_approvals 
FOR UPDATE 
USING (approver_id = auth.uid());

CREATE POLICY "System can create workflow approvals"
ON public.workflow_approvals 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_workflow_approvals_approver ON public.workflow_approvals(approver_id);
CREATE INDEX idx_workflow_approvals_status ON public.workflow_approvals(status);
CREATE INDEX idx_workflow_approvals_execution ON public.workflow_approvals(workflow_execution_id);

-- Create trigger for updated_at
CREATE TRIGGER update_workflow_approvals_updated_at
BEFORE UPDATE ON public.workflow_approvals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();