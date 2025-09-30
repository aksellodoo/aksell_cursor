-- Limpar o documento travado específico
UPDATE public.documents 
SET 
  status = 'failed',
  processing_status = 'failed',
  error_message = 'Documento estava travado em processamento - limpo via migration',
  updated_at = now()
WHERE id = '0586ca2c-9fdb-4915-81fa-a05a2fb086cb';