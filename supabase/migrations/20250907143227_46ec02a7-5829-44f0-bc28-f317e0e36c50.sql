-- Create table for association/syndicate details
CREATE TABLE public.contact_entity_associations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_entity_id uuid NOT NULL REFERENCES public.contact_entities(id) ON DELETE CASCADE,
  
  -- Identificação
  official_name text NOT NULL,
  acronym text,
  association_type text, -- Associação, Sindicato, Federação, Confederação, Câmara de Comércio, ONG
  activity_area text, -- Química, Alimentos, Logística, Trabalhista, etc.
  cnpj text,
  
  -- Endereço & Localização
  address_street text,
  address_number text,
  address_complement text,
  address_neighborhood text,
  city_id uuid REFERENCES public.site_cities(id),
  cep text,
  website text,
  regional_unit text, -- ex.: FIESP – Regional Campinas
  
  -- Relacionamento
  company_relationship_types text[], -- Array: Associado/Filiado, Parceiro Institucional, Participante em Comitês
  participation_level text, -- Membro ativo, Membro passivo, Sem vínculo formal
  responsible_user_id uuid REFERENCES public.profiles(id),
  responsible_department_id uuid REFERENCES public.departments(id),
  current_status text, -- Adimplente, Inadimplente, Inativo, Outro
  interaction_history text,
  
  -- Financeiro
  has_financial_contributions boolean DEFAULT false,
  contribution_amount numeric(10,2),
  contribution_frequency text, -- Mensal, Trimestral, Semestral, Anual
  affiliation_date date,
  association_validity_date date,
  
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_entity_associations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own association details"
ON public.contact_entity_associations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contact_entities ce
    WHERE ce.id = contact_entity_associations.contact_entity_id
    AND ce.created_by = auth.uid()
  )
);

CREATE POLICY "Admins and directors can view all association details"
ON public.contact_entity_associations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = ANY(ARRAY['admin', 'director'])
  )
);

CREATE POLICY "Users can create their own association details"
ON public.contact_entity_associations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contact_entities ce
    WHERE ce.id = contact_entity_associations.contact_entity_id
    AND ce.created_by = auth.uid()
  )
);

CREATE POLICY "Users can update their own association details"
ON public.contact_entity_associations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.contact_entities ce
    WHERE ce.id = contact_entity_associations.contact_entity_id
    AND ce.created_by = auth.uid()
  )
);

CREATE POLICY "Users can delete their own association details"
ON public.contact_entity_associations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.contact_entities ce
    WHERE ce.id = contact_entity_associations.contact_entity_id
    AND ce.created_by = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_contact_entity_associations_updated_at
  BEFORE UPDATE ON public.contact_entity_associations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Create indexes
CREATE INDEX idx_contact_entity_associations_entity_id ON public.contact_entity_associations(contact_entity_id);
CREATE INDEX idx_contact_entity_associations_city_id ON public.contact_entity_associations(city_id);
CREATE INDEX idx_contact_entity_associations_responsible_user ON public.contact_entity_associations(responsible_user_id);
CREATE INDEX idx_contact_entity_associations_responsible_dept ON public.contact_entity_associations(responsible_department_id);