-- Add RLS policies to allow authenticated users to view external partners

-- Policy for contact_entities to view active external partners
CREATE POLICY "View active external partners" 
ON public.contact_entities 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND type = 'parceiros_externos' 
  AND status = 'active'
);

-- Policy for contact_entity_external_partners to view details of visible entities
CREATE POLICY "View external partner details" 
ON public.contact_entity_external_partners 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 
    FROM public.contact_entities ce 
    WHERE ce.id = contact_entity_external_partners.contact_entity_id 
      AND ce.type = 'parceiros_externos' 
      AND ce.status = 'active'
  )
);

-- Policy for contact_entity_tags to view tags of visible entities
CREATE POLICY "View external partner entity tags" 
ON public.contact_entity_tags 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 
    FROM public.contact_entities ce 
    WHERE ce.id = contact_entity_tags.entity_id 
      AND ce.type = 'parceiros_externos' 
      AND ce.status = 'active'
  )
);