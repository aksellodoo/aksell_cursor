-- Fix RLS policies for contact entity tables

-- 1. Fix contact_entity_external_partners policies (add WITH CHECK for admins/directors)
DROP POLICY IF EXISTS "Admins and directors can insert external partner details" ON public.contact_entity_external_partners;
DROP POLICY IF EXISTS "Admins and directors can update external partner details" ON public.contact_entity_external_partners;
DROP POLICY IF EXISTS "Admins and directors can delete external partner details" ON public.contact_entity_external_partners;

CREATE POLICY "Admins and directors can insert external partner details" 
ON public.contact_entity_external_partners 
FOR INSERT 
WITH CHECK (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY (ARRAY['admin'::text, 'director'::text])
));

CREATE POLICY "Admins and directors can update external partner details" 
ON public.contact_entity_external_partners 
FOR UPDATE 
USING (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY (ARRAY['admin'::text, 'director'::text])
))
WITH CHECK (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY (ARRAY['admin'::text, 'director'::text])
));

CREATE POLICY "Admins and directors can delete external partner details" 
ON public.contact_entity_external_partners 
FOR DELETE 
USING (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY (ARRAY['admin'::text, 'director'::text])
));

-- 2. Add missing policies for contact_entity_associations (admins/directors)
CREATE POLICY "Admins and directors can insert association details" 
ON public.contact_entity_associations 
FOR INSERT 
WITH CHECK (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY (ARRAY['admin'::text, 'director'::text])
));

CREATE POLICY "Admins and directors can update association details" 
ON public.contact_entity_associations 
FOR UPDATE 
USING (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY (ARRAY['admin'::text, 'director'::text])
))
WITH CHECK (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY (ARRAY['admin'::text, 'director'::text])
));

CREATE POLICY "Admins and directors can delete association details" 
ON public.contact_entity_associations 
FOR DELETE 
USING (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY (ARRAY['admin'::text, 'director'::text])
));

-- 3. Add missing policies for contact_entity_public_orgs (admins/directors)
CREATE POLICY "Admins and directors can insert public org details" 
ON public.contact_entity_public_orgs 
FOR INSERT 
WITH CHECK (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY (ARRAY['admin'::text, 'director'::text])
));

CREATE POLICY "Admins and directors can update public org details" 
ON public.contact_entity_public_orgs 
FOR UPDATE 
USING (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY (ARRAY['admin'::text, 'director'::text])
))
WITH CHECK (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY (ARRAY['admin'::text, 'director'::text])
));

CREATE POLICY "Admins and directors can delete public org details" 
ON public.contact_entity_public_orgs 
FOR DELETE 
USING (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY (ARRAY['admin'::text, 'director'::text])
));