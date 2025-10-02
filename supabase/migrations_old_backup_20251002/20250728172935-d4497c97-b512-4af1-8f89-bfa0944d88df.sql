-- Create workflow execution steps table
CREATE TABLE public.workflow_execution_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_id UUID NOT NULL REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  step_type TEXT NOT NULL,
  node_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workflow queue table
CREATE TABLE public.workflow_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  trigger_data JSONB DEFAULT '{}',
  priority INTEGER NOT NULL DEFAULT 5,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workflow_execution_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workflow_execution_steps
CREATE POLICY "Users can view workflow execution steps"
ON public.workflow_execution_steps FOR SELECT
USING (true);

CREATE POLICY "System can manage workflow execution steps"
ON public.workflow_execution_steps FOR ALL
USING (true);

-- Create RLS policies for workflow_queue
CREATE POLICY "Users can view workflow queue"
ON public.workflow_queue FOR SELECT
USING (true);

CREATE POLICY "System can manage workflow queue"
ON public.workflow_queue FOR ALL
USING (true);

-- Create indexes for performance
CREATE INDEX idx_workflow_execution_steps_execution_id ON public.workflow_execution_steps(execution_id);
CREATE INDEX idx_workflow_execution_steps_status ON public.workflow_execution_steps(status);
CREATE INDEX idx_workflow_queue_status ON public.workflow_queue(status);
CREATE INDEX idx_workflow_queue_scheduled_at ON public.workflow_queue(scheduled_at);
CREATE INDEX idx_workflow_queue_priority ON public.workflow_queue(priority);

-- Add updated_at trigger
CREATE TRIGGER update_workflow_execution_steps_updated_at
  BEFORE UPDATE ON public.workflow_execution_steps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_queue_updated_at
  BEFORE UPDATE ON public.workflow_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();