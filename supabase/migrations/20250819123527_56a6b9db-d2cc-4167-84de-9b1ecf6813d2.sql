-- Create protheus_table_relationships table
CREATE TABLE public.protheus_table_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_table_id UUID NOT NULL,
  target_table_id UUID NOT NULL,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('1:N', 'N:1', 'N:N')),
  join_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.protheus_table_relationships ENABLE ROW LEVEL SECURITY;

-- Create policies for protheus_table_relationships
CREATE POLICY "Users can view protheus table relationships" 
ON public.protheus_table_relationships 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create protheus table relationships" 
ON public.protheus_table_relationships 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their protheus table relationships" 
ON public.protheus_table_relationships 
FOR UPDATE 
USING ((auth.uid() = created_by) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'director'::text]))))));

CREATE POLICY "Users can delete their protheus table relationships" 
ON public.protheus_table_relationships 
FOR DELETE 
USING ((auth.uid() = created_by) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'director'::text]))))));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_protheus_table_relationships_updated_at
  BEFORE UPDATE ON public.protheus_table_relationships
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();