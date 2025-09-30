-- Primeiro, verificar o table_id da SA1010
SELECT * FROM protheus_dynamic_tables WHERE supabase_table_name = 'protheus_sa1010_721f869c';

-- Deletar a tabela dinâmica criada incorretamente
DROP TABLE IF EXISTS protheus_sa1010_721f869c;

-- Remover registro da tabela de controle
DELETE FROM protheus_dynamic_tables WHERE supabase_table_name = 'protheus_sa1010_721f869c';

-- Limpar logs relacionados (usando o protheus_table_id que encontramos)
DELETE FROM protheus_sync_logs WHERE protheus_table_id = (
  SELECT protheus_table_id FROM protheus_dynamic_tables 
  WHERE supabase_table_name = 'protheus_sa1010_721f869c'
);

-- Verificar se a limpeza foi bem-sucedida
SELECT COUNT(*) as remaining_tables FROM information_schema.tables 
WHERE table_name = 'protheus_sa1010_721f869c';