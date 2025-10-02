-- Criar tabela para logs de sincronização Protheus
CREATE TABLE public.protheus_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protheus_table_id UUID NOT NULL,
  sync_type TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'manual', 'initial'
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'success', 'error', 'partial'
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE,
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_deleted INTEGER DEFAULT 0,
  total_records INTEGER DEFAULT 0,
  error_message TEXT,
  sync_details JSONB DEFAULT '{}',
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_protheus_sync_logs_table_id ON public.protheus_sync_logs(protheus_table_id);
CREATE INDEX idx_protheus_sync_logs_status ON public.protheus_sync_logs(status);
CREATE INDEX idx_protheus_sync_logs_started_at ON public.protheus_sync_logs(started_at);

-- RLS policies para logs
ALTER TABLE public.protheus_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sync logs" 
ON public.protheus_sync_logs 
FOR SELECT 
USING (true);

CREATE POLICY "System can create sync logs" 
ON public.protheus_sync_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update sync logs" 
ON public.protheus_sync_logs 
FOR UPDATE 
USING (true);

-- Tabela para armazenar metadados das tabelas dinâmicas criadas
CREATE TABLE public.protheus_dynamic_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protheus_table_id UUID NOT NULL,
  supabase_table_name TEXT NOT NULL UNIQUE,
  table_structure JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS policies para tabelas dinâmicas
ALTER TABLE public.protheus_dynamic_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view dynamic tables" 
ON public.protheus_dynamic_tables 
FOR SELECT 
USING (true);

CREATE POLICY "System can manage dynamic tables" 
ON public.protheus_dynamic_tables 
FOR ALL 
USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_protheus_dynamic_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_protheus_dynamic_tables_updated_at
BEFORE UPDATE ON public.protheus_dynamic_tables
FOR EACH ROW
EXECUTE FUNCTION public.update_protheus_dynamic_tables_updated_at();