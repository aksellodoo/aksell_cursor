-- Create enum for relationship types
CREATE TYPE public.family_relationship AS ENUM (
  'conjuge',
  'filho_filha', 
  'pai_mae',
  'amigo',
  'companheiro',
  'outro'
);

-- Create enum for usage types
CREATE TYPE public.contact_usage_type AS ENUM (
  'emergencia',
  'convites_eventos',
  'beneficios', 
  'comunicacao_institucional',
  'outro'
);

-- Create enum for legal basis
CREATE TYPE public.lgpd_legal_basis AS ENUM (
  'consentimento',
  'legitimo_interesse',
  'obrigacao_legal'
);

-- Create main friends/family links table
CREATE TABLE public.contact_friend_family_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL,
  target_id UUID NOT NULL,
  relationship family_relationship NOT NULL,
  relationship_other TEXT,
  is_minor BOOLEAN NOT NULL DEFAULT false,
  legal_guardian_name TEXT,
  legal_guardian_contact TEXT,
  usage_types contact_usage_type[] NOT NULL DEFAULT '{}',
  usage_other TEXT,
  legal_basis lgpd_legal_basis NOT NULL,
  has_consent BOOLEAN NOT NULL DEFAULT false,
  consent_date TIMESTAMP WITH TIME ZONE,
  contact_restrictions TEXT,
  dnc_list BOOLEAN NOT NULL DEFAULT false,
  conflict_notes TEXT,
  created_by UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT check_relationship_other CHECK (
    (relationship != 'outro') OR (relationship_other IS NOT NULL AND trim(relationship_other) != '')
  ),
  CONSTRAINT check_usage_other CHECK (
    (NOT 'outro'::contact_usage_type = ANY(usage_types)) OR (usage_other IS NOT NULL AND trim(usage_other) != '')
  ),
  CONSTRAINT check_legal_guardian CHECK (
    (NOT is_minor) OR (legal_guardian_name IS NOT NULL AND legal_guardian_contact IS NOT NULL)
  ),
  CONSTRAINT check_consent_date CHECK (
    (NOT has_consent) OR (consent_date IS NOT NULL)
  )
);

-- Create employees relationship table
CREATE TABLE public.contact_friend_family_link_employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID NOT NULL REFERENCES public.contact_friend_family_links(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(link_id, employee_id)
);

-- Enable RLS
ALTER TABLE public.contact_friend_family_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_friend_family_link_employees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_friend_family_links
CREATE POLICY "Users can view their own friend/family links"
ON public.contact_friend_family_links
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contacts c 
    WHERE c.id = contact_friend_family_links.contact_id 
    AND c.created_by = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = ANY(ARRAY['admin', 'director'])
  )
);

CREATE POLICY "Users can create their own friend/family links"
ON public.contact_friend_family_links
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contacts c 
    WHERE c.id = contact_friend_family_links.contact_id 
    AND c.created_by = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = ANY(ARRAY['admin', 'director'])
  )
);

CREATE POLICY "Users can update their own friend/family links"
ON public.contact_friend_family_links
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.contacts c 
    WHERE c.id = contact_friend_family_links.contact_id 
    AND c.created_by = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = ANY(ARRAY['admin', 'director'])
  )
);

CREATE POLICY "Users can delete their own friend/family links"
ON public.contact_friend_family_links
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.contacts c 
    WHERE c.id = contact_friend_family_links.contact_id 
    AND c.created_by = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = ANY(ARRAY['admin', 'director'])
  )
);

-- RLS Policies for contact_friend_family_link_employees
CREATE POLICY "Users can view employee links for their friend/family links"
ON public.contact_friend_family_link_employees
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contact_friend_family_links ff
    JOIN public.contacts c ON c.id = ff.contact_id
    WHERE ff.id = contact_friend_family_link_employees.link_id
    AND c.created_by = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = ANY(ARRAY['admin', 'director'])
  )
);

CREATE POLICY "Users can create employee links for their friend/family links"
ON public.contact_friend_family_link_employees
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contact_friend_family_links ff
    JOIN public.contacts c ON c.id = ff.contact_id
    WHERE ff.id = contact_friend_family_link_employees.link_id
    AND c.created_by = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = ANY(ARRAY['admin', 'director'])
  )
);

CREATE POLICY "Users can update employee links for their friend/family links"
ON public.contact_friend_family_link_employees
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.contact_friend_family_links ff
    JOIN public.contacts c ON c.id = ff.contact_id
    WHERE ff.id = contact_friend_family_link_employees.link_id
    AND c.created_by = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = ANY(ARRAY['admin', 'director'])
  )
);

CREATE POLICY "Users can delete employee links for their friend/family links"
ON public.contact_friend_family_link_employees
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.contact_friend_family_links ff
    JOIN public.contacts c ON c.id = ff.contact_id
    WHERE ff.id = contact_friend_family_link_employees.link_id
    AND c.created_by = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = ANY(ARRAY['admin', 'director'])
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_contact_friend_family_links_updated_at
  BEFORE UPDATE ON public.contact_friend_family_links
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();