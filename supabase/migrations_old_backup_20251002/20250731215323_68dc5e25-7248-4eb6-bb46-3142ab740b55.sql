-- Criar tabela para logs de sincronização Oracle
CREATE TABLE public.oracle_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operation TEXT NOT NULL,
  table_name TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  execution_time_ms INTEGER,
  records_affected INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Habilitar RLS na tabela oracle_sync_logs
ALTER TABLE public.oracle_sync_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para oracle_sync_logs
CREATE POLICY "Logs Oracle são visíveis para usuários autenticados" 
ON public.oracle_sync_logs 
FOR SELECT 
USING (true);

CREATE POLICY "Sistema pode criar logs Oracle" 
ON public.oracle_sync_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar logs Oracle" 
ON public.oracle_sync_logs 
FOR UPDATE 
USING (true);

-- Criar tabela para dados do Protheus SA1010 (clientes)
CREATE TABLE public.protheus_sa1010 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  a1_cod TEXT NOT NULL,
  a1_loja TEXT NOT NULL,
  a1_nome TEXT,
  a1_nreduz TEXT,
  a1_tipo TEXT,
  a1_cgc TEXT,
  a1_inscr TEXT,
  a1_end TEXT,
  a1_bairro TEXT,
  a1_mun TEXT,
  a1_est TEXT,
  a1_cep TEXT,
  a1_ddd TEXT,
  a1_tel TEXT,
  a1_email TEXT,
  a1_msblql TEXT,
  d_e_l_e_t_ TEXT,
  r_e_c_n_o_ INTEGER,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraint única para evitar duplicatas
  UNIQUE(a1_cod, a1_loja)
);

-- Habilitar RLS na tabela protheus_sa1010
ALTER TABLE public.protheus_sa1010 ENABLE ROW LEVEL SECURITY;

-- Políticas para protheus_sa1010
CREATE POLICY "Dados Protheus são visíveis para usuários autenticados" 
ON public.protheus_sa1010 
FOR SELECT 
USING (true);

CREATE POLICY "Sistema pode inserir dados Protheus" 
ON public.protheus_sa1010 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar dados Protheus" 
ON public.protheus_sa1010 
FOR UPDATE 
USING (true);

-- Índices para melhor performance
CREATE INDEX idx_protheus_sa1010_cod_loja ON public.protheus_sa1010(a1_cod, a1_loja);
CREATE INDEX idx_protheus_sa1010_nome ON public.protheus_sa1010(a1_nome);
CREATE INDEX idx_protheus_sa1010_cgc ON public.protheus_sa1010(a1_cgc);
CREATE INDEX idx_oracle_sync_logs_operation_status ON public.oracle_sync_logs(operation, status);
CREATE INDEX idx_oracle_sync_logs_started_at ON public.oracle_sync_logs(started_at DESC);