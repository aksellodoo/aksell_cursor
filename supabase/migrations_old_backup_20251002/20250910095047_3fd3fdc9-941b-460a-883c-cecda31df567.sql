-- Fix ACL hash inconsistency for documents and chunks
-- This will update all documents and their chunks to use the correct ACL hash
-- based on department_id and folder_id using the compute_acl_hash function

-- Update documents table with correct ACL hash
UPDATE public.documents 
SET acl_hash = public.compute_acl_hash(department_id, folder_id)
WHERE department_id IS NOT NULL AND folder_id IS NOT NULL;

-- Update doc_chunks table with correct ACL hash based on their document's department/folder
UPDATE public.doc_chunks 
SET acl_hash = public.compute_acl_hash(d.department_id, d.folder_id)
FROM public.documents d
WHERE doc_chunks.document_id = d.id 
  AND d.department_id IS NOT NULL 
  AND d.folder_id IS NOT NULL;