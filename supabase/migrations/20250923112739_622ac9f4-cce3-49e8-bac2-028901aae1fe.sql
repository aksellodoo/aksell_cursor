-- Corrigir o chunk_count específico do documento IFF-Teste.docx
UPDATE documents 
SET chunk_count = 1
WHERE id = '21f052da-ab18-45a7-95fa-4952e2c1e018' AND name = 'IFF-Teste.docx';