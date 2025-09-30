-- Corrigir o documento travado atual
UPDATE public.documents 
SET 
  status = 'Aprovado',
  processing_status = 'completed',
  error_message = NULL,
  updated_at = now()
WHERE id = '43ff1945-bcfb-4b6c-a6fa-598426a233a9' AND status = 'Processando';