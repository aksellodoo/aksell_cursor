-- Reprocess the latest uploaded PDF to test dual embedding with increased maxTokens
SELECT supabase.functions.invoke('reprocess-document', json_build_object('document_id', (
  SELECT id FROM documents ORDER BY created_at DESC LIMIT 1
)));