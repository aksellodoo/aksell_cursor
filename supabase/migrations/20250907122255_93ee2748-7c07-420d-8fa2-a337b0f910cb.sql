-- Create table for public organization details
CREATE TABLE public.contact_entity_public_orgs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_entity_id UUID NOT NULL UNIQUE REFERENCES public.contact_entities(id) ON DELETE CASCADE,
  
  -- Identification fields
  official_name TEXT NOT NULL,
  acronym TEXT,
  governmental_sphere TEXT CHECK (governmental_sphere IN ('municipal', 'estadual', 'federal', 'internacional')),
  organ_type TEXT CHECK (organ_type IN ('regulador', 'fiscalizador', 'policia', 'ministerio', 'prefeitura', 'outro')),
  activity_areas TEXT[],
  cnpj TEXT,
  
  -- Address fields
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  city_id UUID REFERENCES public.site_cities(id),
  cep TEXT,
  
  -- Contact and location
  website TEXT,
  regional_unit TEXT,
  
  -- Relationship fields
  relation_type TEXT CHECK (relation_type IN ('fiscalizacao', 'registro_certificacao', 'autorizacao', 'licenciamento', 'outros')),
  relation_detail TEXT,
  responsible_user_id UUID REFERENCES public.profiles(id),
  responsible_department_id UUID REFERENCES public.departments(id),
  status TEXT DEFAULT 'regular' CHECK (status IN ('regular', 'pendente', 'em_fiscalizacao', 'em_auditoria', 'outro')),
  
  -- Audit fields
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_contact_entity_public_orgs_contact_entity_id ON public.contact_entity_public_orgs(contact_entity_id);
CREATE INDEX idx_contact_entity_public_orgs_city_id ON public.contact_entity_public_orgs(city_id);

-- Enable RLS
ALTER TABLE public.contact_entity_public_orgs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (mirror contact_entities)
CREATE POLICY "Admins and directors can view all public org details" 
ON public.contact_entity_public_orgs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY(ARRAY['admin', 'director'])
));

CREATE POLICY "Users can view their own public org details" 
ON public.contact_entity_public_orgs 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own public org details" 
ON public.contact_entity_public_orgs 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own public org details" 
ON public.contact_entity_public_orgs 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own public org details" 
ON public.contact_entity_public_orgs 
FOR DELETE 
USING (auth.uid() = created_by);

-- Trigger for updated_at
CREATE TRIGGER update_contact_entity_public_orgs_updated_at
  BEFORE UPDATE ON public.contact_entity_public_orgs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();