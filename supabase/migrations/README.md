# Migrations Directory

## ⚠️ Important Note

Este diretório foi limpo em 02/10/2024 devido a dessincronia entre migrations locais e remotas.

### Estado Atual:
- **Schema Remoto**: É a fonte da verdade (311 migrations aplicadas desde agosto/2024)
- **Schema Local**: Vazio - as migrations antigas foram movidas para backup

### Backup:
As 833 migrations antigas (com timestamps incorretos) foram movidas para:
`supabase/migrations_old_backup_20251002/`

## Como Criar Novas Migrations

### Método 1: Via Management API (Recomendado para mudanças simples)

```bash
# Exemplo: adicionar uma coluna
curl -X POST "https://api.supabase.com/v1/projects/nahyrexnxhzutfeqxjte/database/query" \
  -H "Authorization: Bearer sbp_5cf553b4fa254419f4738c57b476d9a70a7c0189" \
  -H "Content-Type: application/json" \
  -d '{"query": "ALTER TABLE public.tasks ADD COLUMN new_field TEXT NULL;"}'
```

### Método 2: Via Supabase Dashboard (Recomendado para mudanças complexas)

1. Acesse: https://supabase.com/dashboard/project/nahyrexnxhzutfeqxjte/sql/new
2. Cole o SQL
3. Execute

### Método 3: Via CLI (Requer setup completo)

```bash
# Criar nova migration
export SUPABASE_ACCESS_TOKEN="sbp_5cf553b4fa254419f4738c57b476d9a70a7c0189"
npx supabase migration new <nome_da_migration>

# Editar o arquivo criado em supabase/migrations/
# Aplicar a migration
npx supabase db push
```

## Migrations Aplicadas Manualmente

### 20251002200000 - Add weblink column to tasks
**Status**: ✅ Aplicada em 02/10/2024 via Management API

```sql
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS weblink TEXT NULL;
COMMENT ON COLUMN public.tasks.weblink IS 'Link externo (URL) relacionado à tarefa - opcional';
CREATE INDEX IF NOT EXISTS idx_tasks_weblink ON public.tasks(weblink) WHERE weblink IS NOT NULL;
ALTER TABLE public.tasks ADD CONSTRAINT check_weblink_not_empty CHECK (weblink IS NULL OR length(trim(weblink)) > 0);
```

### 20251002174320 - Test workflow
**Status**: ✅ Aplicada em 02/10/2024 via Management API

```sql
COMMENT ON TABLE public.tasks IS 'Tabela de tarefas do sistema - Workflow validado em 02/10/2024';
```

**Resultado**: ✨ Workflow validado com sucesso!

## Estrutura do Banco Remoto

- **Projeto**: nahyrexnxhzutfeqxjte
- **URL**: https://nahyrexnxhzutfeqxjte.supabase.co
- **Total de migrations remotas**: 311
- **Primeira migration**: 20250822054440
- **Última migration**: 20250930024604

## Credenciais

Veja [SUPABASE_WORKFLOW.md](../SUPABASE_WORKFLOW.md) para informações sobre credenciais e workflow.
