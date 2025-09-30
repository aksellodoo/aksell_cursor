-- Adicionar campo para notificação antes do vencimento
ALTER TABLE public.documents 
ADD COLUMN notify_before_expiry_days INTEGER;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.documents.notify_before_expiry_days IS 'Número de dias antes do vencimento para notificar os revisores';