#!/bin/bash
# Script para criar e aplicar uma nova migration no Supabase

set -e

if [ -z "$1" ]; then
  echo "❌ Erro: Nome da migration não fornecido"
  echo ""
  echo "Uso: ./scripts/supabase-create-migration.sh <nome_da_migration>"
  echo "Exemplo: ./scripts/supabase-create-migration.sh add_user_preferences"
  exit 1
fi

MIGRATION_NAME=$1
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
FILENAME="supabase/migrations/${TIMESTAMP}_${MIGRATION_NAME}.sql"

# Configurar token
export SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-sbp_5cf553b4fa254419f4738c57b476d9a70a7c0189}"

echo "📝 Criando nova migration: $MIGRATION_NAME"
echo ""

# Criar arquivo de migration
cat > "$FILENAME" <<EOF
-- Migration: $MIGRATION_NAME
-- Created: $(date +"%Y-%m-%d %H:%M:%S")
-- Description: [Descreva as mudanças aqui]

-- Adicione seu SQL aqui:
-- CREATE TABLE...
-- ALTER TABLE...
-- etc.

EOF

echo "✅ Arquivo criado: $FILENAME"
echo ""
echo "📝 Próximos passos:"
echo "1. Edite o arquivo $FILENAME"
echo "2. Adicione seu SQL"
echo "3. Execute: node scripts/supabase-execute-sql.mjs < $FILENAME"
echo "   OU acesse: https://supabase.com/dashboard/project/nahyrexnxhzutfeqxjte/sql/new"
echo ""
echo "Abrindo arquivo no editor..."

# Abrir no editor padrão (ajuste conforme necessário)
if command -v code &> /dev/null; then
  code "$FILENAME"
elif command -v notepad &> /dev/null; then
  notepad "$FILENAME"
else
  echo "💡 Por favor, abra manualmente: $FILENAME"
fi
