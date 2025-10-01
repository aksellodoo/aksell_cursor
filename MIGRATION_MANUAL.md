# Migration Manual - Add allow_delete to folders

## Como Aplicar a Migration

A coluna `allow_delete` precisa ser adicionada manualmente ao banco de dados.

### Opção 1: Via Supabase Dashboard (RECOMENDADO)

1. Acesse: https://supabase.com/dashboard/project/nahyrexnxhzutfeqxjte/editor
2. Clique em "SQL Editor" no menu lateral
3. Clique em "New Query"
4. Cole o seguinte SQL:

```sql
-- Add allow_delete column to folders table
-- This field controls whether a folder can be deleted from the system

-- Add column with default true (all existing folders remain deletable)
ALTER TABLE public.folders
ADD COLUMN IF NOT EXISTS allow_delete BOOLEAN NOT NULL DEFAULT true;

-- Create index for performance when filtering by allow_delete
CREATE INDEX IF NOT EXISTS idx_folders_allow_delete
ON public.folders(allow_delete);

-- Add comment explaining the field
COMMENT ON COLUMN public.folders.allow_delete IS
'Determines if this folder can be deleted. If false, folder is protected from deletion across the entire system.';
```

5. Clique em "Run" ou pressione Ctrl+Enter
6. Verifique se aparece mensagem de sucesso

### Opção 2: Via Supabase CLI

```bash
# Login no Supabase CLI
npx supabase login

# Link com o projeto
npx supabase link --project-ref nahyrexnxhzutfeqxjte

# Apply migrations
npx supabase db push
```

### Opção 3: Via psql direto

```bash
psql "postgresql://postgres.nahyrexnxhzutfeqxjte:[PASSWORD]@db.nahyrexnxhzutfeqxjte.supabase.co:5432/postgres" < supabase/migrations/20251002130000_add_folder_allow_delete.sql
```

## Verificação

Após aplicar, verifique se a coluna foi criada:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'folders' AND column_name = 'allow_delete';
```

Resultado esperado:
- column_name: `allow_delete`
- data_type: `boolean`
- is_nullable: `NO`
- column_default: `true`
