
-- Marcar a tabela SA1010 como "Linkado fora Protheus"
UPDATE public.protheus_tables
SET linked_outside_protheus = true,
    updated_at = now()
WHERE upper(table_name) = 'SA1010';
