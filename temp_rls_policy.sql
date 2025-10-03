-- Política para permitir leitura de arquivos por usuários autenticados
CREATE POLICY "Allow authenticated users to read task attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'task-attachments');

-- Política para permitir upload de arquivos por usuários autenticados
CREATE POLICY "Allow authenticated users to upload task attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task-attachments');
