-- Limpeza completa da tabela SA1010
-- Remover logs de sincronização
DELETE FROM protheus_sync_logs WHERE protheus_table_id = '4eb98c2d-7216-4abd-8802-f81568633578';

-- Remover entrada da tabela protheus_tables
DELETE FROM protheus_tables WHERE id = '4eb98c2d-7216-4abd-8802-f81568633578';