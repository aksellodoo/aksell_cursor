-- Criar tabela para registrar erros de sincronização
CREATE TABLE public.protheus_sync_errors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_log_id UUID NOT NULL,
  protheus_table_id UUID NOT NULL,
  record_data JSONB NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_details JSONB DEFAULT '{}',
  protheus_key_fields JSONB NOT NULL,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT
);

-- Índices para melhor performance
CREATE INDEX idx_protheus_sync_errors_sync_log ON public.protheus_sync_errors(sync_log_id);
CREATE INDEX idx_protheus_sync_errors_table ON public.protheus_sync_errors(protheus_table_id);
CREATE INDEX idx_protheus_sync_errors_type ON public.protheus_sync_errors(error_type);
CREATE INDEX idx_protheus_sync_errors_created ON public.protheus_sync_errors(created_at);

-- RLS policies
ALTER TABLE public.protheus_sync_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sync errors"
ON public.protheus_sync_errors
FOR SELECT
USING (true);

CREATE POLICY "System can insert sync errors"
ON public.protheus_sync_errors
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update sync errors"
ON public.protheus_sync_errors
FOR UPDATE
USING (true);

-- Comentários para documentação
COMMENT ON TABLE public.protheus_sync_errors IS 'Registra erros específicos que ocorrem durante a sincronização de dados do Protheus';
COMMENT ON COLUMN public.protheus_sync_errors.sync_log_id IS 'Referência ao log de sincronização onde o erro ocorreu';
COMMENT ON COLUMN public.protheus_sync_errors.record_data IS 'Dados completos do registro que falhou na inserção';
COMMENT ON COLUMN public.protheus_sync_errors.error_type IS 'Tipo do erro: duplicate_key, validation_error, constraint_violation, etc.';
COMMENT ON COLUMN public.protheus_sync_errors.protheus_key_fields IS 'Campos que formam a chave única no Protheus (ex: A1_FILIAL, A1_COD, A1_LOJA)';
COMMENT ON COLUMN public.protheus_sync_errors.attempt_number IS 'Número da tentativa de inserção (para reprocessamento)';