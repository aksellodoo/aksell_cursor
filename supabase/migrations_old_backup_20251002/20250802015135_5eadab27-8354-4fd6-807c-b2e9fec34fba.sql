-- Criar tabela para campos extras das tabelas Protheus
CREATE TABLE public.protheus_table_extra_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protheus_table_id UUID NOT NULL REFERENCES public.protheus_tables(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  default_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Garantir que não há campos duplicados por tabela
  UNIQUE(protheus_table_id, field_name)
);

-- Habilitar RLS
ALTER TABLE public.protheus_table_extra_fields ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view extra fields for accessible tables" 
ON public.protheus_table_extra_fields 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.protheus_tables pt 
    WHERE pt.id = protheus_table_extra_fields.protheus_table_id
  )
);

CREATE POLICY "Users can create extra fields for their tables" 
ON public.protheus_table_extra_fields 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.protheus_tables pt 
    WHERE pt.id = protheus_table_extra_fields.protheus_table_id 
    AND (pt.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'director')
    ))
  )
);

CREATE POLICY "Users can update extra fields for their tables" 
ON public.protheus_table_extra_fields 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.protheus_tables pt 
    WHERE pt.id = protheus_table_extra_fields.protheus_table_id 
    AND (pt.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'director')
    ))
  )
);

CREATE POLICY "Users can delete extra fields for their tables" 
ON public.protheus_table_extra_fields 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.protheus_tables pt 
    WHERE pt.id = protheus_table_extra_fields.protheus_table_id 
    AND (pt.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'director')
    ))
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_protheus_table_extra_fields_updated_at
BEFORE UPDATE ON public.protheus_table_extra_fields
FOR EACH ROW
EXECUTE FUNCTION public.update_protheus_tables_updated_at();