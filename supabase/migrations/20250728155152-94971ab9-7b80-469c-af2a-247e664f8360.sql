-- Add new fields to workflows table
ALTER TABLE public.workflows 
ADD COLUMN workflow_type text NOT NULL DEFAULT 'manual',
ADD COLUMN department_ids uuid[] DEFAULT NULL,
ADD COLUMN tags text[] DEFAULT NULL,
ADD COLUMN confidentiality_level confidentiality_level NOT NULL DEFAULT 'public',
ADD COLUMN priority text NOT NULL DEFAULT 'medium',
ADD COLUMN status text NOT NULL DEFAULT 'active';

-- Create indexes for better performance
CREATE INDEX idx_workflows_type ON public.workflows(workflow_type);
CREATE INDEX idx_workflows_departments ON public.workflows USING GIN(department_ids);
CREATE INDEX idx_workflows_tags ON public.workflows USING GIN(tags);
CREATE INDEX idx_workflows_confidentiality ON public.workflows(confidentiality_level);
CREATE INDEX idx_workflows_priority ON public.workflows(priority);
CREATE INDEX idx_workflows_status ON public.workflows(status);

-- Create function to check workflow access based on confidentiality
CREATE OR REPLACE FUNCTION public.can_access_workflow(workflow_confidentiality confidentiality_level, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role text;
  is_user_leader boolean;
BEGIN
  -- Buscar role e status de liderança do usuário
  SELECT role, is_leader 
  INTO user_role, is_user_leader
  FROM public.profiles 
  WHERE id = user_id;
  
  -- Verificar acesso baseado no nível de confidencialidade
  CASE workflow_confidentiality
    WHEN 'public' THEN
      RETURN true; -- Qualquer usuário autenticado pode ver
    WHEN 'department_leaders' THEN
      RETURN is_user_leader = true OR user_role IN ('director', 'admin', 'hr');
    WHEN 'directors_admins' THEN
      RETURN user_role IN ('director', 'admin');
    ELSE
      RETURN false;
  END CASE;
END;
$function$;

-- Update RLS policies to consider confidentiality
DROP POLICY IF EXISTS "Users can view workflows" ON public.workflows;
CREATE POLICY "Users can view workflows with confidentiality check" 
ON public.workflows 
FOR SELECT 
USING (can_access_workflow(confidentiality_level, auth.uid()));

-- Update other RLS policies to maintain existing permissions
DROP POLICY IF EXISTS "Users can update their workflows" ON public.workflows;
CREATE POLICY "Users can update their workflows" 
ON public.workflows 
FOR UPDATE 
USING (
  (auth.uid() = created_by OR 
   EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ANY(ARRAY['admin', 'hr', 'director'])))
  AND can_access_workflow(confidentiality_level, auth.uid())
);

DROP POLICY IF EXISTS "Users can delete their workflows" ON public.workflows;
CREATE POLICY "Users can delete their workflows" 
ON public.workflows 
FOR DELETE 
USING (
  (auth.uid() = created_by OR 
   EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ANY(ARRAY['admin', 'hr', 'director'])))
  AND can_access_workflow(confidentiality_level, auth.uid())
);