-- Limpeza completa da tabela SA1010 para permitir novo teste de sincronização

-- Dropar tabela dinâmica
DROP TABLE IF EXISTS protheus_sa1010_721f869c CASCADE;

-- Remover registro de controle da tabela dinâmica
DELETE FROM protheus_dynamic_tables 
WHERE id = '54240fcb-ca9c-4e26-8d7a-69219f07fe84';

-- Limpar logs relacionados à tabela SA1010
DELETE FROM protheus_sync_logs 
WHERE protheus_table_id = '721f869c-1b2d-4362-a3a8-3971fdddae6a';