-- Adicionar campos de controle de hash SHA256 à tabela protheus_tables
ALTER TABLE public.protheus_tables 
ADD COLUMN enable_sha256_hash boolean NOT NULL DEFAULT false,
ADD COLUMN log_hash_changes boolean NOT NULL DEFAULT false,
ADD COLUMN detect_new_records boolean NOT NULL DEFAULT false,
ADD COLUMN detect_deleted_records boolean NOT NULL DEFAULT false;