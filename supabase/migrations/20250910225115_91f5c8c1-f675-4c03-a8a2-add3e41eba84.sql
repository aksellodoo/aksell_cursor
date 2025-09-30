-- Fix compute_document_acl_hash function with correct parameter order
CREATE OR REPLACE FUNCTION compute_document_acl_hash(doc_id UUID)
RETURNS TEXT AS $$
DECLARE
    acl_hash TEXT;
BEGIN
    -- Use the existing compute_acl_hash function with correct parameter order (department_id, folder_id)
    SELECT INTO acl_hash 
        compute_acl_hash(
            p_department_id := COALESCE(f.department_id, d.department_id),
            p_folder_id := COALESCE(d.folder_id, f.id)
        )
    FROM documents d
    LEFT JOIN folders f ON d.folder_id = f.id
    WHERE d.id = doc_id;
    
    RETURN acl_hash;
END;
$$ LANGUAGE plpgsql;

-- Reprocess all documents and chunks with correct ACL hash
UPDATE documents 
SET acl_hash = compute_document_acl_hash(id)
WHERE acl_hash IS NULL OR acl_hash != compute_document_acl_hash(id);

UPDATE doc_chunks 
SET acl_hash = compute_document_acl_hash(document_id)
WHERE acl_hash IS NULL OR acl_hash != compute_document_acl_hash(document_id);