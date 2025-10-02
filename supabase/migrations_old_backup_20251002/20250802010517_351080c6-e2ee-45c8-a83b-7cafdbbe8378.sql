-- Criar tabela para gerenciar tabelas Protheus
CREATE TABLE public.protheus_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  query_interval_value INTEGER NOT NULL DEFAULT 60,
  query_interval_unit TEXT NOT NULL DEFAULT 'minutes' CHECK (query_interval_unit IN ('seconds', 'minutes', 'hours', 'days')),
  fetch_all_fields BOOLEAN NOT NULL DEFAULT true,
  create_supabase_table BOOLEAN NOT NULL DEFAULT false,
  extra_database_fields BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.protheus_tables ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view protheus tables" 
ON public.protheus_tables 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create protheus tables" 
ON public.protheus_tables 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their protheus tables" 
ON public.protheus_tables 
FOR UPDATE 
USING (auth.uid() = created_by OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'director')
));

CREATE POLICY "Users can delete their protheus tables" 
ON public.protheus_tables 
FOR DELETE 
USING (auth.uid() = created_by OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'director')
));

-- Create index for better performance
CREATE INDEX idx_protheus_tables_created_by ON public.protheus_tables(created_by);
CREATE INDEX idx_protheus_tables_table_name ON public.protheus_tables(table_name);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_protheus_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_protheus_tables_updated_at
BEFORE UPDATE ON public.protheus_tables
FOR EACH ROW
EXECUTE FUNCTION public.update_protheus_tables_updated_at();