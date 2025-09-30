-- Test reprocessing the latest Sulfato Ferroso document
SELECT supabase.functions.invoke('reprocess-document', json_build_object('document_id', 'f98c0603-4765-4da7-b5d7-9e4b77894295'));