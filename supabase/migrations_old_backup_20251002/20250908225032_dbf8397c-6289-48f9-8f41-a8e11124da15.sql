-- Add RLS policies to allow admins/directors to edit any contact entity and external partner details

-- Policy for contact_entities: allow admins/directors to update any entity
CREATE POLICY "Admins and directors can update any entity" 
ON public.contact_entities 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'director')
  )
);

-- Policies for contact_entity_external_partners: allow admins/directors full access
CREATE POLICY "Admins and directors can insert external partner details" 
ON public.contact_entity_external_partners 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'director')
  )
);

CREATE POLICY "Admins and directors can update external partner details" 
ON public.contact_entity_external_partners 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'director')
  )
);

CREATE POLICY "Admins and directors can delete external partner details" 
ON public.contact_entity_external_partners 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'director')
  )
);