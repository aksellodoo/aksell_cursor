-- Adicionar campo rag_capabilities na tabela documents
ALTER TABLE public.documents 
ADD COLUMN rag_capabilities jsonb DEFAULT '{}'::jsonb;

-- Criar função para atualizar capabilities dos documentos
CREATE OR REPLACE FUNCTION public.update_document_rag_capabilities()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  doc_id uuid;
  capabilities jsonb := '{}'::jsonb;
  text_count integer := 0;
  ocr_count integer := 0;
  semantic_count integer := 0;
  total_pages integer := 0;
  processed_pages integer := 0;
BEGIN
  -- Determinar document_id baseado na operação
  IF TG_OP = 'DELETE' THEN
    doc_id := OLD.document_id;
  ELSE
    doc_id := NEW.document_id;
  END IF;

  -- Contar chunks por tipo de extração
  SELECT 
    COUNT(*) FILTER (WHERE extraction_source IN ('pdf_js', 'text_extraction')) as text_extraction,
    COUNT(*) FILTER (WHERE extraction_source = 'ocr') as ocr_extraction,
    COUNT(*) FILTER (WHERE extraction_source = 'semantic_chunker') as semantic_extraction,
    COUNT(DISTINCT COALESCE(page_number, slide_number, 1)) as processed_page_count
  INTO text_count, ocr_count, semantic_count, processed_pages
  FROM public.doc_chunks 
  WHERE document_id = doc_id;

  -- Obter total de páginas do documento
  SELECT COALESCE(page_count, 1) INTO total_pages
  FROM public.documents 
  WHERE id = doc_id;

  -- Construir objeto capabilities
  capabilities := jsonb_build_object(
    'has_text_extraction', text_count > 0,
    'has_ocr', ocr_count > 0,
    'has_semantic', semantic_count > 0,
    'text_chunks', text_count,
    'ocr_chunks', ocr_count,
    'semantic_chunks', semantic_count,
    'total_chunks', text_count + ocr_count + semantic_count,
    'processed_pages', processed_pages,
    'total_pages', total_pages,
    'coverage_percentage', CASE 
      WHEN total_pages > 0 THEN ROUND((processed_pages::numeric / total_pages::numeric) * 100, 1)
      ELSE 0
    END
  );

  -- Atualizar documento
  UPDATE public.documents 
  SET rag_capabilities = capabilities
  WHERE id = doc_id;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Criar trigger para atualização automática
DROP TRIGGER IF EXISTS tg_update_document_rag_capabilities ON public.doc_chunks;
CREATE TRIGGER tg_update_document_rag_capabilities
  AFTER INSERT OR UPDATE OR DELETE ON public.doc_chunks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_document_rag_capabilities();

-- Atualizar capabilities para todos os documentos existentes
DO $$
DECLARE
  doc_record RECORD;
BEGIN
  FOR doc_record IN SELECT DISTINCT document_id FROM public.doc_chunks LOOP
    PERFORM public.update_document_rag_capabilities_manual(doc_record.document_id);
  END LOOP;
END $$;

-- Função manual para atualizar capabilities de um documento específico
CREATE OR REPLACE FUNCTION public.update_document_rag_capabilities_manual(doc_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  capabilities jsonb := '{}'::jsonb;
  text_count integer := 0;
  ocr_count integer := 0;
  semantic_count integer := 0;
  total_pages integer := 0;
  processed_pages integer := 0;
BEGIN
  -- Contar chunks por tipo de extração
  SELECT 
    COUNT(*) FILTER (WHERE extraction_source IN ('pdf_js', 'text_extraction')) as text_extraction,
    COUNT(*) FILTER (WHERE extraction_source = 'ocr') as ocr_extraction,
    COUNT(*) FILTER (WHERE extraction_source = 'semantic_chunker') as semantic_extraction,
    COUNT(DISTINCT COALESCE(page_number, slide_number, 1)) as processed_page_count
  INTO text_count, ocr_count, semantic_count, processed_pages
  FROM public.doc_chunks 
  WHERE document_id = doc_id;

  -- Obter total de páginas do documento
  SELECT COALESCE(page_count, 1) INTO total_pages
  FROM public.documents 
  WHERE id = doc_id;

  -- Construir objeto capabilities
  capabilities := jsonb_build_object(
    'has_text_extraction', text_count > 0,
    'has_ocr', ocr_count > 0,
    'has_semantic', semantic_count > 0,
    'text_chunks', text_count,
    'ocr_chunks', ocr_count,
    'semantic_chunks', semantic_count,
    'total_chunks', text_count + ocr_count + semantic_count,
    'processed_pages', processed_pages,
    'total_pages', total_pages,
    'coverage_percentage', CASE 
      WHEN total_pages > 0 THEN ROUND((processed_pages::numeric / total_pages::numeric) * 100, 1)
      ELSE 0
    END
  );

  -- Atualizar documento
  UPDATE public.documents 
  SET rag_capabilities = capabilities
  WHERE id = doc_id;
END;
$function$;