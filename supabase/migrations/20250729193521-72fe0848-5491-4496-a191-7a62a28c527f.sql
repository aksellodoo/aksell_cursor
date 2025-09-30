-- Adicionar 'needs_correction' ao enum approval_status
ALTER TYPE approval_status ADD VALUE 'needs_correction';

-- Criar tabela para gerenciar correções de workflow
CREATE TABLE public.workflow_corrections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_execution_id UUID NOT NULL,
  approval_id UUID NOT NULL,
  requested_by UUID NOT NULL,
  assigned_to UUID NOT NULL,
  correction_details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resubmitted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.workflow_corrections ENABLE ROW LEVEL SECURITY;

-- RLS policies para workflow_corrections
CREATE POLICY "Users can view corrections assigned to them or requested by them"
ON public.workflow_corrections
FOR SELECT
USING (
  assigned_to = auth.uid() OR 
  requested_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM workflow_executions we 
    WHERE we.id = workflow_corrections.workflow_execution_id 
    AND we.triggered_by = auth.uid()
  )
);

CREATE POLICY "System can create workflow corrections"
ON public.workflow_corrections
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update corrections assigned to them"
ON public.workflow_corrections
FOR UPDATE
USING (
  assigned_to = auth.uid() OR 
  requested_by = auth.uid()
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_workflow_corrections_updated_at
BEFORE UPDATE ON public.workflow_corrections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();