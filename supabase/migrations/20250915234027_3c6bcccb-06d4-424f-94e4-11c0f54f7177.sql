-- Adicionar constraint único para prevenir duplicatas de documentos
-- Impede inserção de documentos com mesmo nome, tamanho e pasta
CREATE UNIQUE INDEX IF NOT EXISTS documents_unique_file_per_folder 
ON public.documents (folder_id, name, file_size) 
WHERE status != 'Obsoleto';