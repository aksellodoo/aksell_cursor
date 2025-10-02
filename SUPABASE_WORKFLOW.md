# Supabase Workflow - Guia Completo

> **Guia de referência detalhado para operações com Supabase**
>
> **Para instruções gerais do projeto, consulte:** [Claude.md](Claude.md)
>
> **Última atualização:** 02/10/2024

---

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Credenciais e Autenticação](#credenciais-e-autenticação)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Como Criar Migrations](#como-criar-migrations)
5. [Como Aplicar Mudanças](#como-aplicar-mudanças)
6. [Comandos Úteis](#comandos-úteis)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Este projeto usa **Supabase** como backend (PostgreSQL + Auth + Storage + Edge Functions).

**Informações do Projeto:**
- **Project ID**: `nahyrexnxhzutfeqxjte`
- **URL**: https://nahyrexnxhzutfeqxjte.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/nahyrexnxhzutfeqxjte

**Estado das Migrations:**
- ✅ Schema remoto contém 311 migrations aplicadas (fonte da verdade)
- 📂 Migrations locais foram limpas em 02/10/2024
- 💾 Backup das migrations antigas em: `supabase/migrations_old_backup_20251002/`

---

## 🔐 Credenciais e Autenticação

### Variáveis de Ambiente

Crie/edite o arquivo `.env.local` (já está no `.gitignore`):

```bash
# Supabase Service Role Key (para operações administrativas)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haHlyZXhueGh6dXRmZXF4anRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgwMDAyOSwiZXhwIjoyMDcxMzc2MDI5fQ.4LanZ7zT7lt6vcgI-vBtQy_GGIOPQ31B3hKq58ZY7CU"

# Personal Access Token para Supabase CLI
SUPABASE_ACCESS_TOKEN="sbp_5cf553b4fa254419f4738c57b476d9a70a7c0189"
```

### Chaves no `.env` (frontend)

O arquivo `.env` contém as chaves públicas:

```bash
VITE_SUPABASE_PROJECT_ID="nahyrexnxhzutfeqxjte"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haHlyZXhueGh6dXRmZXF4anRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDAwMjksImV4cCI6MjA3MTM3NjAyOX0.PoT9gaGRaS6XEvUxlakJA9LIZ66aVSjNFEOFfR0qOsg"
VITE_SUPABASE_URL="https://nahyrexnxhzutfeqxjte.supabase.co"
```

**⚠️ IMPORTANTE:**
- `.env.local` → NUNCA commitar (contém secrets)
- `.env` → Pode ser commitado (apenas chaves públicas)

---

## 📁 Estrutura do Projeto

```
aksell_cursor/
├── .env                    # Variáveis públicas (frontend)
├── .env.local             # Variáveis secretas (NUNCA commitar)
├── supabase/
│   ├── config.toml        # Configuração do projeto Supabase
│   ├── migrations/        # Migrations (vazio após limpeza)
│   │   └── README.md      # Documentação das migrations
│   ├── migrations_old_backup_20251002/  # Backup das migrations antigas
│   └── functions/         # Edge Functions
│       ├── import-documents/
│       ├── delete-document/
│       └── send-form-invitation/
├── scripts/
│   ├── supabase-execute-sql.mjs        # Script para executar SQL via API
│   └── supabase-create-migration.sh    # Script para criar nova migration
└── SUPABASE_WORKFLOW.md   # Este documento
```

---

## 🆕 Como Criar Migrations

### Método 1: Via Management API ⭐ (Recomendado para mudanças simples)

**Vantagens:**
- ✅ Rápido e direto
- ✅ Não precisa de Docker
- ✅ Funciona sempre

**Usando o script personalizado:**

```bash
# Executar SQL diretamente
npm run supabase:sql "ALTER TABLE tasks ADD COLUMN new_field TEXT;"

# Ou ler de arquivo
npm run supabase:sql < supabase/migrations/20241002_add_field.sql

# Ou usar o node diretamente
node scripts/supabase-execute-sql.mjs "SELECT * FROM tasks LIMIT 5;"
```

**Usando curl:**

```bash
curl -X POST "https://api.supabase.com/v1/projects/nahyrexnxhzutfeqxjte/database/query" \
  -H "Authorization: Bearer sbp_5cf553b4fa254419f4738c57b476d9a70a7c0189" \
  -H "Content-Type: application/json" \
  -d '{"query": "ALTER TABLE public.tasks ADD COLUMN example TEXT NULL;"}'
```

### Método 2: Via Dashboard 🌐 (Recomendado para mudanças complexas)

**Vantagens:**
- ✅ Interface visual
- ✅ Syntax highlighting
- ✅ Histórico de queries
- ✅ Fácil de ver erros

**Passos:**

1. Acesse: https://supabase.com/dashboard/project/nahyrexnxhzutfeqxjte/sql/new
2. Cole seu SQL
3. Clique em "Run"
4. Verifique o resultado

### Método 3: Via CLI 💻 (Requer Docker)

**Vantagens:**
- ✅ Controle de versão automático
- ✅ Sincronização com git
- ✅ Ideal para workflows complexos

**Desvantagens:**
- ❌ Requer Docker instalado
- ❌ Migrations remotas não estão sincronizadas localmente

**Passos:**

```bash
# 1. Configurar token
export SUPABASE_ACCESS_TOKEN="sbp_5cf553b4fa254419f4738c57b476d9a70a7c0189"

# 2. Criar nova migration
npm run supabase:migration add_new_feature
# OU
npx supabase migration new add_new_feature

# 3. Editar o arquivo criado em supabase/migrations/
# (arquivo abrirá automaticamente no editor)

# 4. Aplicar migration (CUIDADO: pode ter conflitos!)
npx supabase db push
```

---

## 🚀 Como Aplicar Mudanças

### Workflow Recomendado para Mudanças de Schema

```bash
# 1. Criar arquivo de migration local
npm run supabase:migration add_user_preferences

# 2. Editar o arquivo gerado (supabase/migrations/TIMESTAMP_add_user_preferences.sql)
# Adicionar SQL:
# ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;

# 3. Aplicar via API (método mais seguro)
npm run supabase:sql < supabase/migrations/TIMESTAMP_add_user_preferences.sql

# 4. Verificar no Dashboard
# https://supabase.com/dashboard/project/nahyrexnxhzutfeqxjte/editor

# 5. Commitar a migration no git
git add supabase/migrations/TIMESTAMP_add_user_preferences.sql
git commit -m "feat: add user preferences column"
```

### Exemplos Práticos

#### Adicionar uma coluna

```sql
-- supabase/migrations/20241002120000_add_archived_field.sql
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.tasks.archived IS 'Indica se a tarefa foi arquivada';

CREATE INDEX IF NOT EXISTS idx_tasks_archived
ON public.tasks(archived)
WHERE archived = TRUE;
```

```bash
# Aplicar
npm run supabase:sql < supabase/migrations/20241002120000_add_archived_field.sql
```

#### Criar uma nova tabela

```sql
-- supabase/migrations/20241002130000_create_notifications.sql
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read) WHERE read = FALSE;

-- RLS (Row Level Security)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE public.notifications IS 'Notificações do sistema para usuários';
```

```bash
# Aplicar
npm run supabase:sql < supabase/migrations/20241002130000_create_notifications.sql
```

---

## 🛠️ Comandos Úteis

### Scripts NPM

```bash
# Executar SQL
npm run supabase:sql "SELECT version();"

# Criar nova migration
npm run supabase:migration add_new_feature

# Desenvolvimento (frontend)
npm run dev

# Build
npm run build
```

### Supabase CLI (com autenticação)

```bash
# Configurar token (em cada sessão)
export SUPABASE_ACCESS_TOKEN="sbp_5cf553b4fa254419f4738c57b476d9a70a7c0189"

# Status do projeto
npx supabase status

# Listar migrations remotas (requer autenticação)
npx supabase migration list --linked

# Criar nova migration
npx supabase migration new nome_da_migration

# Push migrations (CUIDADO: pode falhar devido a dessincronia)
npx supabase db push

# Ver diferenças de schema
npx supabase db diff

# Fazer deploy de Edge Function
npx supabase functions deploy nome-da-funcao
```

### Queries SQL Úteis

```bash
# Ver todas as tabelas
npm run supabase:sql "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"

# Ver colunas de uma tabela
npm run supabase:sql "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' ORDER BY ordinal_position;"

# Ver índices
npm run supabase:sql "SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'tasks';"

# Ver migrations aplicadas
npm run supabase:sql "SELECT version, inserted_at FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 10;"

# Contar registros
npm run supabase:sql "SELECT COUNT(*) FROM tasks;"
```

---

## 🔧 Troubleshooting

### Problema: "Access token not provided"

**Solução:**
```bash
export SUPABASE_ACCESS_TOKEN="sbp_5cf553b4fa254419f4738c57b476d9a70a7c0189"
```

Ou adicione no seu `.bashrc`/`.zshrc`:
```bash
echo 'export SUPABASE_ACCESS_TOKEN="sbp_5cf553b4fa254419f4738c57b476d9a70a7c0189"' >> ~/.bashrc
source ~/.bashrc
```

### Problema: "column does not exist" no frontend

**Causa:** Schema remoto não tem a coluna que o código está tentando acessar.

**Solução:**
1. Criar migration com a coluna
2. Aplicar via API ou Dashboard
3. Verificar que foi aplicada

```bash
# Verificar se coluna existe
npm run supabase:sql "SELECT column_name FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'weblink';"
```

### Problema: "Remote migration versions not found in local migrations"

**Causa:** Migrations remotas não existem localmente (foi o caso que limpamos).

**Solução Aplicada:**
- Mantemos o schema remoto como fonte da verdade
- Usamos API direta para mudanças
- Documentamos tudo em `supabase/migrations/README.md`

**Solução Alternativa (não recomendada):**
- Executar 311 comandos `supabase migration repair` (muito trabalhoso)
- OU reconstruir histórico completo localmente (complexo)

### Problema: Docker não está rodando

**Sintoma:** `supabase start` ou `supabase db dump` falham.

**Solução:**
1. Iniciar Docker Desktop
2. OU usar métodos que não precisam de Docker (API, Dashboard)

### Problema: Erro de permissão ao executar SQL

**Causa:** Token `anon` não tem permissões administrativas.

**Solução:** Usar o Personal Access Token via Management API (como nos scripts).

### Problema: Como reverter uma migration?

**Opções:**

1. **Via SQL direto (mais simples):**
```bash
# Criar migration de rollback
cat > supabase/migrations/20241002_rollback_example.sql <<EOF
-- Rollback: remove column added in previous migration
ALTER TABLE public.tasks DROP COLUMN IF EXISTS example_field;
EOF

# Aplicar
npm run supabase:sql < supabase/migrations/20241002_rollback_example.sql
```

2. **Via Dashboard:**
- Acesse o SQL Editor
- Execute o SQL de rollback manualmente

---

## 📚 Recursos Adicionais

- **Documentação Supabase**: https://supabase.com/docs
- **Supabase CLI**: https://supabase.com/docs/guides/cli
- **Management API**: https://supabase.com/docs/reference/api
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

## 🎓 Best Practices

1. **Sempre teste migrations em desenvolvimento primeiro**
   ```bash
   # Testar query antes de aplicar
   npm run supabase:sql "SELECT * FROM tasks LIMIT 1;"
   ```

2. **Use transações para mudanças múltiplas**
   ```sql
   BEGIN;

   ALTER TABLE tasks ADD COLUMN field1 TEXT;
   ALTER TABLE tasks ADD COLUMN field2 INT;
   CREATE INDEX idx_tasks_field1 ON tasks(field1);

   COMMIT;
   ```

3. **Sempre adicione comentários nas migrations**
   ```sql
   -- Migration: Add user preferences
   -- Date: 2024-10-02
   -- Purpose: Store user UI preferences as JSONB
   ```

4. **Use IF EXISTS/IF NOT EXISTS**
   ```sql
   ALTER TABLE tasks ADD COLUMN IF NOT EXISTS example TEXT;
   DROP INDEX IF EXISTS idx_example;
   ```

5. **Documente no README.md das migrations**
   - Adicione entrada em `supabase/migrations/README.md`
   - Descreva o que foi mudado
   - Marque como aplicada

6. **Sempre commite migrations no git**
   ```bash
   git add supabase/migrations/
   git commit -m "feat: add notifications table"
   ```

---

**Última atualização:** 02/10/2024
**Responsável:** Sistema de gerenciamento de migrations Supabase
