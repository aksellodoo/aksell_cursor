-- Limpar completamente os dados da tabela SA1010 problemática
DELETE FROM protheus_table_extra_fields WHERE protheus_table_id = 'b0bb3b0c-1a49-4b4c-b5ba-6f70a9767f7e';
DELETE FROM protheus_dynamic_tables WHERE protheus_table_id = 'b0bb3b0c-1a49-4b4c-b5ba-6f70a9767f7e';
DELETE FROM protheus_sync_logs WHERE protheus_table_id = 'b0bb3b0c-1a49-4b4c-b5ba-6f70a9767f7e';

-- Dropar tabela física se existir
DROP TABLE IF EXISTS protheus_sa1010_b0bb3b0c;