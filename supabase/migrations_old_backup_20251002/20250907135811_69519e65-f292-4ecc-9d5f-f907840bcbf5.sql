-- Create contact_entity_tags table to link entities with tags
CREATE TABLE public.contact_entity_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id uuid NOT NULL REFERENCES public.contact_entities(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.email_tags(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  UNIQUE(entity_id, tag_id)
);

-- Create indexes for performance
CREATE INDEX idx_contact_entity_tags_entity_id ON public.contact_entity_tags(entity_id);
CREATE INDEX idx_contact_entity_tags_tag_id ON public.contact_entity_tags(tag_id);

-- Enable RLS
ALTER TABLE public.contact_entity_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins and directors can view all entity tags" 
ON public.contact_entity_tags 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY(ARRAY['admin', 'director'])
));

CREATE POLICY "Users can view tags of their own entities" 
ON public.contact_entity_tags 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM contact_entities ce
  WHERE ce.id = contact_entity_tags.entity_id 
  AND ce.created_by = auth.uid()
));

CREATE POLICY "Admins and directors can manage all entity tags" 
ON public.contact_entity_tags 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY(ARRAY['admin', 'director'])
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY(ARRAY['admin', 'director'])
));

CREATE POLICY "Users can manage tags of their own entities" 
ON public.contact_entity_tags 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM contact_entities ce
  WHERE ce.id = contact_entity_tags.entity_id 
  AND ce.created_by = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM contact_entities ce
  WHERE ce.id = contact_entity_tags.entity_id 
  AND ce.created_by = auth.uid()
));