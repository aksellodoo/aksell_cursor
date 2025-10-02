-- Criar tabela de tags para documentos
CREATE TABLE IF NOT EXISTS public.document_tags_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true
);

-- Criar tabela de relacionamento documento-tags
CREATE TABLE IF NOT EXISTS public.document_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.document_tags_master(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(document_id, tag_id)
);

-- Habilitar RLS
ALTER TABLE public.document_tags_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_tags ENABLE ROW LEVEL SECURITY;

-- Políticas para document_tags_master
CREATE POLICY "Users can view document tags" 
ON public.document_tags_master 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can create document tags" 
ON public.document_tags_master 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own document tags" 
ON public.document_tags_master 
FOR UPDATE 
TO authenticated
USING (auth.uid() = created_by);

-- Políticas para document_tags (relacionamentos)
CREATE POLICY "Users can view document tag relationships" 
ON public.document_tags 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.documents d 
    WHERE d.id = document_tags.document_id 
    AND (d.uploaded_by = auth.uid() OR auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'director')
    ))
  )
);

CREATE POLICY "Users can create document tag relationships" 
ON public.document_tags 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.documents d 
    WHERE d.id = document_tags.document_id 
    AND (d.uploaded_by = auth.uid() OR auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'director')
    ))
  )
  AND auth.uid() = created_by
);

CREATE POLICY "Users can delete document tag relationships" 
ON public.document_tags 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.documents d 
    WHERE d.id = document_tags.document_id 
    AND (d.uploaded_by = auth.uid() OR auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'director')
    ))
  )
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_document_tags_document_id ON public.document_tags(document_id);
CREATE INDEX IF NOT EXISTS idx_document_tags_tag_id ON public.document_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_document_tags_master_name ON public.document_tags_master(name);

-- Função para buscar ou criar tag
CREATE OR REPLACE FUNCTION public.find_or_create_document_tag(
  p_tag_name TEXT,
  p_created_by UUID DEFAULT auth.uid()
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tag_id UUID;
BEGIN
  -- Normalizar nome da tag (trim e lowercase)
  p_tag_name := TRIM(LOWER(p_tag_name));
  
  -- Buscar tag existente
  SELECT id INTO v_tag_id
  FROM public.document_tags_master
  WHERE LOWER(name) = p_tag_name
  AND is_active = true
  LIMIT 1;
  
  -- Se não existir, criar nova tag
  IF v_tag_id IS NULL THEN
    INSERT INTO public.document_tags_master (name, created_by)
    VALUES (p_tag_name, p_created_by)
    RETURNING id INTO v_tag_id;
  END IF;
  
  RETURN v_tag_id;
END;
$$;