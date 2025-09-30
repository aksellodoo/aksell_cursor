-- Create enums for external partners
CREATE TYPE public.partner_type AS ENUM (
  'ong',
  'universidade', 
  'instituto_pesquisa',
  'camara_comercio',
  'embaixada',
  'midia',
  'evento',
  'incubadora',
  'escola_tecnica',
  'comunidade_oss',
  'outro'
);

CREATE TYPE public.relationship_nature AS ENUM (
  'institucional',
  'projeto',
  'patrocinio_nao_comercial',
  'doacao',
  'voluntariado',
  'divulgacao',
  'mentoria',
  'outro'
);

CREATE TYPE public.risk_level AS ENUM (
  'baixo',
  'medio',
  'alto'
);

CREATE TYPE public.lgpd_basis AS ENUM (
  'consentimento',
  'legitimo_interesse',
  'cumprimento_obrigacao_legal',
  'protecao_vida',
  'exercicio_poder_publico',
  'interesse_legitimo'
);

CREATE TYPE public.relevance AS ENUM (
  'estrategico',
  'tatico',
  'ocasional'
);

CREATE TYPE public.partner_status AS ENUM (
  'ativo',
  'pausado',
  'encerrado',
  'avaliando'
);

CREATE TYPE public.project_status AS ENUM (
  'planejado',
  'em_andamento',
  'concluido',
  'cancelado'
);

-- Create external partners details table
CREATE TABLE public.contact_entity_external_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_entity_id UUID NOT NULL REFERENCES public.contact_entities(id) ON DELETE CASCADE,
  
  -- Identification
  official_name TEXT NOT NULL,
  trade_name TEXT,
  cnpj TEXT,
  partner_type public.partner_type NOT NULL,
  interest_areas TEXT[],
  website TEXT,
  official_profiles TEXT[], -- LinkedIn, Instagram, etc.
  
  -- Framework & Compliance
  relationship_nature public.relationship_nature[] NOT NULL DEFAULT '{}',
  relationship_nature_other TEXT,
  risk_level public.risk_level DEFAULT 'baixo',
  nda_mou_term BOOLEAN DEFAULT false,
  nda_mou_number TEXT,
  nda_mou_url TEXT,
  nda_mou_validity DATE,
  conflict_of_interest BOOLEAN DEFAULT false,
  conflict_observation TEXT,
  lgpd_basis public.lgpd_basis,
  
  -- Scope & Interactions
  relationship_objective TEXT,
  kpis TEXT,
  counterparts TEXT,
  
  -- Internal Relationship
  responsible_user_id UUID REFERENCES auth.users(id),
  responsible_department_id UUID REFERENCES public.departments(id),
  internal_areas TEXT[], -- Departments involved
  relevance public.relevance DEFAULT 'tatico',
  status public.partner_status DEFAULT 'ativo',
  
  -- Address & Channels
  city_id UUID REFERENCES public.site_cities(id),
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  cep TEXT,
  generic_email TEXT,
  phone TEXT,
  contact_form_url TEXT,
  media_kit_url TEXT,
  
  -- Documents & Evidence
  drive_link TEXT,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create partner projects table
CREATE TABLE public.contact_partner_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.contact_entity_external_partners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status public.project_status DEFAULT 'planejado',
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_entity_external_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_partner_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for external partners
CREATE POLICY "Users can view their own external partner details" 
ON public.contact_entity_external_partners 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.contact_entities ce
  WHERE ce.id = contact_entity_external_partners.contact_entity_id 
  AND ce.created_by = auth.uid()
));

CREATE POLICY "Admins and directors can view all external partner details" 
ON public.contact_entity_external_partners 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'director')
));

CREATE POLICY "Users can create their own external partner details" 
ON public.contact_entity_external_partners 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.contact_entities ce
  WHERE ce.id = contact_entity_external_partners.contact_entity_id 
  AND ce.created_by = auth.uid()
));

CREATE POLICY "Users can update their own external partner details" 
ON public.contact_entity_external_partners 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.contact_entities ce
  WHERE ce.id = contact_entity_external_partners.contact_entity_id 
  AND ce.created_by = auth.uid()
));

CREATE POLICY "Users can delete their own external partner details" 
ON public.contact_entity_external_partners 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.contact_entities ce
  WHERE ce.id = contact_entity_external_partners.contact_entity_id 
  AND ce.created_by = auth.uid()
));

-- RLS Policies for partner projects
CREATE POLICY "Users can view projects of their own partners" 
ON public.contact_partner_projects 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.contact_entity_external_partners ep
  JOIN public.contact_entities ce ON ce.id = ep.contact_entity_id
  WHERE ep.id = contact_partner_projects.partner_id 
  AND ce.created_by = auth.uid()
));

CREATE POLICY "Admins and directors can view all partner projects" 
ON public.contact_partner_projects 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'director')
));

CREATE POLICY "Users can create projects for their own partners" 
ON public.contact_partner_projects 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.contact_entity_external_partners ep
  JOIN public.contact_entities ce ON ce.id = ep.contact_entity_id
  WHERE ep.id = contact_partner_projects.partner_id 
  AND ce.created_by = auth.uid()
));

CREATE POLICY "Users can update projects of their own partners" 
ON public.contact_partner_projects 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.contact_entity_external_partners ep
  JOIN public.contact_entities ce ON ce.id = ep.contact_entity_id
  WHERE ep.id = contact_partner_projects.partner_id 
  AND ce.created_by = auth.uid()
));

CREATE POLICY "Users can delete projects of their own partners" 
ON public.contact_partner_projects 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.contact_entity_external_partners ep
  JOIN public.contact_entities ce ON ce.id = ep.contact_entity_id
  WHERE ep.id = contact_partner_projects.partner_id 
  AND ce.created_by = auth.uid()
));

-- Create triggers for updated_at
CREATE TRIGGER update_contact_entity_external_partners_updated_at
  BEFORE UPDATE ON public.contact_entity_external_partners
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER update_contact_partner_projects_updated_at
  BEFORE UPDATE ON public.contact_partner_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_set_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_contact_entity_external_partners_contact_entity_id 
ON public.contact_entity_external_partners(contact_entity_id);

CREATE INDEX idx_contact_entity_external_partners_partner_type 
ON public.contact_entity_external_partners(partner_type);

CREATE INDEX idx_contact_entity_external_partners_status 
ON public.contact_entity_external_partners(status);

CREATE INDEX idx_contact_partner_projects_partner_id 
ON public.contact_partner_projects(partner_id);

CREATE INDEX idx_contact_partner_projects_status 
ON public.contact_partner_projects(status);