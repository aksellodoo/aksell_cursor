-- Limpar documentos travados em processamento
UPDATE documents 
SET 
  status = 'Rejeitado',
  updated_at = now(),
  error_message = 'Timeout no processamento - documento foi limpo automaticamente'
WHERE 
  status = 'Processando' 
  AND created_at < (now() - INTERVAL '10 minutes');

-- Adicionar função para cleanup automático de documentos travados
CREATE OR REPLACE FUNCTION cleanup_stuck_documents()
RETURNS integer AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Atualizar documentos travados há mais de 10 minutos
  UPDATE documents 
  SET 
    status = 'Rejeitado',
    updated_at = now(),
    error_message = 'Timeout no processamento - documento foi limpo automaticamente'
  WHERE 
    status = 'Processando' 
    AND created_at < (now() - INTERVAL '10 minutes');
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adicionar função para tratamento de erros de OCR
CREATE OR REPLACE FUNCTION handle_ocr_error(
  p_document_id uuid,
  p_error_message text,
  p_should_retry boolean DEFAULT false
)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- Atualizar status do documento
  IF p_should_retry THEN
    UPDATE documents 
    SET 
      status = 'Processando',
      updated_at = now(),
      error_message = p_error_message,
      retry_count = COALESCE(retry_count, 0) + 1
    WHERE id = p_document_id;
  ELSE
    UPDATE documents 
    SET 
      status = 'Rejeitado',
      updated_at = now(),
      error_message = CASE 
        WHEN p_error_message ILIKE '%memory%' OR p_error_message ILIKE '%timeout%' 
        THEN 'Falha no processamento: arquivo muito grande. Tente reduzir o tamanho da imagem.'
        ELSE p_error_message
      END
    WHERE id = p_document_id;
  END IF;
  
  result := json_build_object(
    'success', true,
    'document_id', p_document_id,
    'action', CASE WHEN p_should_retry THEN 'retry' ELSE 'rejected' END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;