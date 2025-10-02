-- Criar tabela para armazenar consultas Protheus salvas
CREATE TABLE public.protheus_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  query_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_public BOOLEAN DEFAULT false,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX idx_protheus_queries_created_by ON public.protheus_queries(created_by);
CREATE INDEX idx_protheus_queries_name ON public.protheus_queries(name);
CREATE INDEX idx_protheus_queries_updated_at ON public.protheus_queries(updated_at);

-- Habilitar RLS
ALTER TABLE public.protheus_queries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own queries" 
ON public.protheus_queries
FOR ALL 
USING (auth.uid() = created_by);

CREATE POLICY "Users can view public queries" 
ON public.protheus_queries
FOR SELECT 
USING (is_public = true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_protheus_queries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_protheus_queries_updated_at
  BEFORE UPDATE ON public.protheus_queries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_protheus_queries_updated_at();