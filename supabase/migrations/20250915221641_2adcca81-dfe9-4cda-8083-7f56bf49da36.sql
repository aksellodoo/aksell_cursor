-- Primeira etapa: Limpeza de dados órfãos existentes
-- Limpar chunks órfãos (se existirem)
DELETE FROM doc_chunks 
WHERE document_id NOT IN (SELECT id FROM documents);

-- Segunda etapa: Adicionar ON DELETE CASCADE ao foreign key
-- Primeiro, remover a constraint existente
ALTER TABLE doc_chunks 
DROP CONSTRAINT IF EXISTS doc_chunks_document_id_fkey;

-- Recriar a constraint com CASCADE
ALTER TABLE doc_chunks 
ADD CONSTRAINT doc_chunks_document_id_fkey 
FOREIGN KEY (document_id) 
REFERENCES documents(id) 
ON DELETE CASCADE;

-- Terceira etapa: Verificar e limpar outros possíveis dados órfãos relacionados a documentos
-- (Adicionar aqui outras tabelas que possam ter referências a documents se existirem)

-- Log da operação para auditoria
INSERT INTO cron_job_logs (job_name, status, details) 
VALUES (
  'cleanup_orphaned_data_and_add_cascade', 
  'success', 
  jsonb_build_object(
    'orphaned_chunks_deleted', (
      SELECT COUNT(*) FROM doc_chunks 
      WHERE document_id NOT IN (SELECT id FROM documents)
    ),
    'cascade_constraint_added', true,
    'timestamp', now()
  )
);