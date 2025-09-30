-- Tabela para armazenar preferências de notificação de tabelas Protheus por usuário
CREATE TABLE public.user_protheus_table_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  protheus_table_id UUID NOT NULL,
  record_statuses TEXT[] NOT NULL DEFAULT '{}', -- 'new', 'updated', 'deleted'
  notification_channels JSONB NOT NULL DEFAULT '{"app": true, "email": false, "telegram": false, "whatsapp": false}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL DEFAULT auth.uid(),
  
  -- Evitar duplicatas por usuário e tabela
  UNIQUE(user_id, protheus_table_id)
);

-- Tabela para fila de notificações de mudanças detectadas
CREATE TABLE public.protheus_notification_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protheus_table_id UUID NOT NULL,
  record_id TEXT NOT NULL, -- ID do registro que mudou
  record_status TEXT NOT NULL, -- 'new', 'updated', 'deleted'
  record_data JSONB, -- Dados do registro (para contexto na notificação)
  previous_data JSONB, -- Dados anteriores (para mudanças)
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'sent', 'failed'
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_protheus_table_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protheus_notification_queue ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_protheus_table_notifications
CREATE POLICY "Users can view their own protheus table notifications"
  ON public.user_protheus_table_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own protheus table notifications"
  ON public.user_protheus_table_notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth.uid() = created_by);

CREATE POLICY "Users can update their own protheus table notifications"
  ON public.user_protheus_table_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own protheus table notifications"
  ON public.user_protheus_table_notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all protheus table notifications"
  ON public.user_protheus_table_notifications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'director')
  ));

-- Políticas RLS para protheus_notification_queue
CREATE POLICY "System can manage notification queue"
  ON public.protheus_notification_queue FOR ALL
  USING (true)
  WITH CHECK (true);

-- Usuários autenticados podem visualizar para debug/monitoring
CREATE POLICY "Authenticated users can view notification queue"
  ON public.protheus_notification_queue FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Índices para performance
CREATE INDEX idx_user_protheus_notifications_user_id ON public.user_protheus_table_notifications(user_id);
CREATE INDEX idx_user_protheus_notifications_table_id ON public.user_protheus_table_notifications(protheus_table_id);
CREATE INDEX idx_user_protheus_notifications_active ON public.user_protheus_table_notifications(is_active) WHERE is_active = true;

CREATE INDEX idx_protheus_queue_status ON public.protheus_notification_queue(status);
CREATE INDEX idx_protheus_queue_table_id ON public.protheus_notification_queue(protheus_table_id);
CREATE INDEX idx_protheus_queue_detected_at ON public.protheus_notification_queue(detected_at);
CREATE INDEX idx_protheus_queue_pending ON public.protheus_notification_queue(status, detected_at) WHERE status = 'pending';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_protheus_notifications_updated_at
  BEFORE UPDATE ON public.user_protheus_table_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();