-- Create contact_entities table
CREATE TABLE public.contact_entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_entities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own entities" 
ON public.contact_entities 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own entities" 
ON public.contact_entities 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own entities" 
ON public.contact_entities 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own entities" 
ON public.contact_entities 
FOR DELETE 
USING (auth.uid() = created_by);

CREATE POLICY "Admins and directors can view all entities" 
ON public.contact_entities 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY(ARRAY['admin', 'director'])
));

-- Create trigger for updated_at
CREATE TRIGGER update_contact_entities_updated_at
BEFORE UPDATE ON public.contact_entities
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();