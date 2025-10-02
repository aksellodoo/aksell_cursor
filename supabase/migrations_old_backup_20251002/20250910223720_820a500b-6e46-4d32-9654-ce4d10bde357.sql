-- Backfill ACL hashes for documents and chunks to fix missing documents in AI search

-- First, let's create a function to compute ACL hash consistently
CREATE OR REPLACE FUNCTION compute_document_acl_hash(doc_id UUID)
RETURNS TEXT AS $$
DECLARE
    acl_hash TEXT;
BEGIN
    -- Use the existing compute_acl_hash function with the document's folder and department
    SELECT INTO acl_hash 
        compute_acl_hash(
            COALESCE(d.folder_id, f.id),
            COALESCE(f.department_id, d.department_id)
        )
    FROM documents d
    LEFT JOIN folders f ON d.folder_id = f.id
    WHERE d.id = doc_id;
    
    RETURN acl_hash;
END;
$$ LANGUAGE plpgsql;

-- Update all documents with correct ACL hash
UPDATE documents 
SET acl_hash = compute_document_acl_hash(id)
WHERE acl_hash IS NULL OR acl_hash != compute_document_acl_hash(id);

-- Update all document chunks with correct ACL hash
UPDATE doc_chunks 
SET acl_hash = compute_document_acl_hash(document_id)
WHERE acl_hash IS NULL OR acl_hash != compute_document_acl_hash(document_id);

-- Create indexes to improve performance
CREATE INDEX IF NOT EXISTS idx_documents_acl_hash ON documents(acl_hash);
CREATE INDEX IF NOT EXISTS idx_doc_chunks_acl_hash ON doc_chunks(acl_hash);

-- Add a trigger to automatically update ACL hash when document folder changes
CREATE OR REPLACE FUNCTION update_document_acl_hash()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the document's ACL hash
    NEW.acl_hash = compute_document_acl_hash(NEW.id);
    
    -- Also update all chunks for this document
    UPDATE doc_chunks 
    SET acl_hash = NEW.acl_hash
    WHERE document_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_document_acl_hash ON documents;
CREATE TRIGGER trigger_update_document_acl_hash
    BEFORE UPDATE OF folder_id, department_id ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_document_acl_hash();