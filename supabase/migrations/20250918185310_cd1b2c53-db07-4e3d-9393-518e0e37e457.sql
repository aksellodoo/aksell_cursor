-- Atualizar bucket docs-prod para aceitar arquivos PowerPoint
UPDATE storage.buckets 
SET allowed_mime_types = array_append(
  array_append(
    allowed_mime_types, 
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ),
  'application/vnd.ms-powerpoint'
)
WHERE name = 'docs-prod';