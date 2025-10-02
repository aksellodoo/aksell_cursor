-- Limpar documento travado
UPDATE documents 
SET status = 'Rejeitado', updated_at = now() 
WHERE id = 'ff18eae9-54fb-47d5-bbe0-586998ed5d21' 
AND status = 'processing';