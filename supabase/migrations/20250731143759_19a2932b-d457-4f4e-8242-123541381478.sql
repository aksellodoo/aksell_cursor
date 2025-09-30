-- Criar tabela para sincronização da SA1010 (clientes Protheus)
CREATE TABLE IF NOT EXISTS public.protheus_sa1010 (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  a1_cod text NOT NULL, -- Código do cliente
  a1_loja text NOT NULL, -- Loja do cliente
  a1_nome text, -- Nome do cliente
  a1_nreduz text, -- Nome reduzido
  a1_tipo text, -- Tipo (F=Física, J=Jurídica)
  a1_cgc text, -- CNPJ/CPF
  a1_inscr text, -- Inscrição estadual
  a1_end text, -- Endereço
  a1_bairro text, -- Bairro
  a1_mun text, -- Município
  a1_est text, -- Estado
  a1_cep text, -- CEP
  a1_ddd text, -- DDD
  a1_tel text, -- Telefone
  a1_email text, -- Email
  a1_msblql text, -- Status (1=Bloqueado, 2=Ativo)
  d_e_l_e_t_ text, -- Campo de deleção
  r_e_c_n_o_ integer, -- Número do registro
  synced_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(a1_cod, a1_loja)
);

-- Habilitar RLS
ALTER TABLE public.protheus_sa1010 ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
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

-- Criar tabela de logs de sincronização
CREATE TABLE IF NOT EXISTS public.oracle_sync_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name text NOT NULL,
  operation text NOT NULL, -- 'sync', 'test', 'error'
  status text NOT NULL, -- 'success', 'error', 'partial'
  records_affected integer DEFAULT 0,
  error_message text,
  execution_time_ms integer,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'
);

-- Habilitar RLS
ALTER TABLE public.oracle_sync_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para logs
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

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_protheus_sa1010_cod_loja ON public.protheus_sa1010(a1_cod, a1_loja);
CREATE INDEX IF NOT EXISTS idx_protheus_sa1010_cgc ON public.protheus_sa1010(a1_cgc);
CREATE INDEX IF NOT EXISTS idx_protheus_sa1010_nome ON public.protheus_sa1010(a1_nome);
CREATE INDEX IF NOT EXISTS idx_oracle_sync_logs_table_status ON public.oracle_sync_logs(table_name, status);
CREATE INDEX IF NOT EXISTS idx_oracle_sync_logs_started_at ON public.oracle_sync_logs(started_at DESC);