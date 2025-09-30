-- Corrigir ACL hash do documento IFF-Teste para coincidir com outros documentos do mesmo departamento
UPDATE doc_chunks 
SET acl_hash = '497fecbe98962d36c543370f79a30981'
WHERE document_id = 'd431d503-aebd-45b9-b1c1-b8398494bd89'
AND acl_hash = 'f327226cc87b742450bf8fe889e1ca79';

-- Também corrigir o ACL hash do documento principal se necessário
UPDATE documents 
SET acl_hash = '497fecbe98962d36c543370f79a30981'
WHERE id = 'd431d503-aebd-45b9-b1c1-b8398494bd89'
AND acl_hash = 'f327226cc87b742450bf8fe889e1ca79';