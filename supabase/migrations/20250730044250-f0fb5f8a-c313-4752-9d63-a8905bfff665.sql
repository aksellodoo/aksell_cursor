-- Create forms table
CREATE TABLE public.forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'draft',
  is_public BOOLEAN NOT NULL DEFAULT false,
  allow_anonymous BOOLEAN NOT NULL DEFAULT false,
  settings JSONB NOT NULL DEFAULT '{}',
  fields_definition JSONB NOT NULL DEFAULT '[]',
  share_settings JSONB NOT NULL DEFAULT '{}',
  confidentiality_level confidentiality_level NOT NULL DEFAULT 'public'
);

-- Create form responses table
CREATE TABLE public.form_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL,
  response_data JSONB NOT NULL DEFAULT '{}',
  submitted_by UUID,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'
);

-- Create form analytics table  
CREATE TABLE public.form_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID,
  session_id TEXT
);

-- Enable RLS
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forms
CREATE POLICY "Users can view forms with confidentiality check" 
ON public.forms 
FOR SELECT 
USING (can_access_confidential_file(confidentiality_level, auth.uid()));

CREATE POLICY "Users can create forms" 
ON public.forms 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their forms" 
ON public.forms 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their forms" 
ON public.forms 
FOR DELETE 
USING (auth.uid() = created_by);

-- RLS Policies for form responses
CREATE POLICY "Form creators can view responses" 
ON public.form_responses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.forms 
    WHERE id = form_responses.form_id 
    AND created_by = auth.uid()
  )
);

CREATE POLICY "Anyone can submit responses to public forms" 
ON public.form_responses 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.forms 
    WHERE id = form_responses.form_id 
    AND (is_public = true OR created_by = auth.uid())
  )
);

-- RLS Policies for form analytics
CREATE POLICY "Form creators can view analytics" 
ON public.form_analytics 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.forms 
    WHERE id = form_analytics.form_id 
    AND created_by = auth.uid()
  )
);

CREATE POLICY "System can create analytics" 
ON public.form_analytics 
FOR INSERT 
WITH CHECK (true);

-- Add foreign key constraints
ALTER TABLE public.form_responses 
ADD CONSTRAINT fk_form_responses_form_id 
FOREIGN KEY (form_id) REFERENCES public.forms(id) ON DELETE CASCADE;

ALTER TABLE public.form_analytics 
ADD CONSTRAINT fk_form_analytics_form_id 
FOREIGN KEY (form_id) REFERENCES public.forms(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_forms_created_by ON public.forms(created_by);
CREATE INDEX idx_forms_status ON public.forms(status);
CREATE INDEX idx_form_responses_form_id ON public.form_responses(form_id);
CREATE INDEX idx_form_responses_submitted_at ON public.form_responses(submitted_at);
CREATE INDEX idx_form_analytics_form_id ON public.form_analytics(form_id);
CREATE INDEX idx_form_analytics_event_type ON public.form_analytics(event_type);

-- Update forms updated_at trigger
CREATE TRIGGER update_forms_updated_at
BEFORE UPDATE ON public.forms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();