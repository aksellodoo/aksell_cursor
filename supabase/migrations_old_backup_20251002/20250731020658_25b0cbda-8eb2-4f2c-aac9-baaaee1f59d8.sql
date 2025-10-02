-- Primeiro, alterar o enum confidentiality_level para incluir 'private'
ALTER TYPE confidentiality_level ADD VALUE IF NOT EXISTS 'private';