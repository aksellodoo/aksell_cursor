UPDATE documents 
SET status = 'failed', 
    error_message = 'Processamento travado - resetado automaticamente', 
    updated_at = now() 
WHERE id = 'acc7e81f-3c9a-4a45-9350-91c0acc8a18f' 
  AND status = 'processing';