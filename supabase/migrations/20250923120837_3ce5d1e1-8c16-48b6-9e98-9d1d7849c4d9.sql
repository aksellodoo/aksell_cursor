-- Habilitar document_root_enabled para todos os departamentos existentes
UPDATE departments 
SET document_root_enabled = true 
WHERE document_root_enabled = false;

-- Alterar o padrão da coluna para novos departamentos
ALTER TABLE departments 
ALTER COLUMN document_root_enabled SET DEFAULT true;