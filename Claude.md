# 🤖 Instruções para Claude Code - Projeto Aksell Cursor

> **Documento de referência principal para Claude Code trabalhar neste projeto**
>
> **Última atualização:** 03/10/2025

---

## 📋 Índice
1. [Informações do Projeto](#-informações-do-projeto)
2. [Configuração do Ambiente](#-configuração-do-ambiente)
3. [Workflow do Supabase](#-workflow-do-supabase)
4. [Workflow do Git](#-workflow-do-git)
5. [Gestão de Tarefas e Progresso](#-gestão-de-tarefas-e-progresso)
6. [Preview e Desenvolvimento](#-preview-e-desenvolvimento)
7. [Testes Automatizados com MCP Playwright](#-testes-automatizados-com-mcp-playwright)
8. [Comandos Úteis](#-comandos-úteis)
9. [Regras Importantes](#-regras-importantes)

---

## 🎯 Informações do Projeto

### Nome do Projeto
**Aksell Cursor** - Sistema de Gestão Empresarial

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite
- **UI:** shadcn/ui + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Form Builder:** CKEditor 5 + Drag & Drop (dnd-kit)

### Links Importantes
- **Supabase Dashboard:** https://supabase.com/dashboard/project/nahyrexnxhzutfeqxjte
- **Supabase SQL Editor:** https://supabase.com/dashboard/project/nahyrexnxhzutfeqxjte/sql/new
- **Preview Local:** http://localhost:8080
- **Project ID:** `nahyrexnxhzutfeqxjte`

### Documentação do Projeto
- **[SUPABASE_WORKFLOW.md](SUPABASE_WORKFLOW.md)** - Guia completo de Supabase (credenciais, migrations, comandos)
- **[projectplan.md](projectplan.md)** - Histórico de alterações e tarefas concluídas

---

## 🔐 Configuração do Ambiente

### Variáveis de Ambiente

#### `.env` (Frontend - Público)
```bash
VITE_SUPABASE_PROJECT_ID="nahyrexnxhzutfeqxjte"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haHlyZXhueGh6dXRmZXF4anRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDAwMjksImV4cCI6MjA3MTM3NjAyOX0.PoT9gaGRaS6XEvUxlakJA9LIZ66aVSjNFEOFfR0qOsg"
VITE_SUPABASE_URL="https://nahyrexnxhzutfeqxjte.supabase.co"
```

#### `.env.local` (Backend - Secreto - NUNCA COMMITAR)
```bash
# Supabase Service Role Key (para operações administrativas)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haHlyZXhueGh6dXRmZXF4anRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgwMDAyOSwiZXhwIjoyMDcxMzc2MDI5fQ.4LanZ7zT7lt6vcgI-vBtQy_GGIOPQ31B3hKq58ZY7CU"

# Personal Access Token para Supabase CLI e Management API
SUPABASE_ACCESS_TOKEN="sbp_5cf553b4fa254419f4738c57b476d9a70a7c0189"
```

### Credenciais Supabase (Referência Rápida)

| Tipo | Valor |
|------|-------|
| **Project ID** | `nahyrexnxhzutfeqxjte` |
| **URL** | `https://nahyrexnxhzutfeqxjte.supabase.co` |
| **Anon Key** | (veja `.env`) |
| **Service Role Key** | (veja `.env.local`) |
| **Access Token** | `sbp_5cf553b4fa254419f4738c57b476d9a70a7c0189` |

**⚠️ IMPORTANTE:** O `.env.local` já está no `.gitignore` e não deve ser commitado.

---

## 🗄️ Workflow do Supabase

### Como Conectar ao Supabase

**O projeto já está configurado e conectado!** Você tem 3 métodos para executar operações no banco:

### Método 1: Via Management API (⭐ Recomendado)

**Vantagens:** Rápido, não precisa de Docker, funciona sempre.

```bash
# Executar SQL diretamente
npm run supabase:sql "SELECT * FROM tasks LIMIT 5;"

# Ou ler de arquivo
npm run supabase:sql < supabase/migrations/20241002_add_field.sql

# Exemplos práticos
npm run supabase:sql "ALTER TABLE tasks ADD COLUMN new_field TEXT;"
npm run supabase:sql "SELECT version();"
```

### Método 2: Via Supabase Dashboard

**Vantagens:** Interface visual, syntax highlighting, fácil de usar.

1. Acesse: https://supabase.com/dashboard/project/nahyrexnxhzutfeqxjte/sql/new
2. Cole seu SQL
3. Clique em "Run"
4. Veja os resultados

### Método 3: Via Supabase CLI

**Vantagens:** Controle de versão, sincronização automática.

```bash
# Criar nova migration
npm run supabase:migration add_new_feature

# Ou usando npx
export SUPABASE_ACCESS_TOKEN="sbp_5cf553b4fa254419f4738c57b476d9a70a7c0189"
npx supabase migration new add_new_feature
```

### Como Criar e Aplicar Migrations

**Fluxo recomendado:**

```bash
# 1. Criar arquivo de migration
npm run supabase:migration add_user_preferences

# 2. Editar arquivo gerado (abre automaticamente)
# Adicionar SQL: ALTER TABLE users ADD COLUMN preferences JSONB;

# 3. Aplicar via API
npm run supabase:sql < supabase/migrations/TIMESTAMP_add_user_preferences.sql

# 4. Documentar em supabase/migrations/README.md
# Adicionar entrada com data e descrição

# 5. Commitar no git (após perguntar ao usuário)
git add supabase/migrations/
git commit -m "feat: add user preferences column"
```

### Como Fazer Deploy de Edge Functions

```bash
# Deploy de uma edge function
npx supabase functions deploy nome-da-funcao --project-ref nahyrexnxhzutfeqxjte

# Configurar secrets
npx supabase secrets set OPENAI_API_KEY=sk-xxx --project-ref nahyrexnxhzutfeqxjte

# Ver logs
npx supabase functions logs nome-da-funcao --project-ref nahyrexnxhzutfeqxjte
```

### Documentação Completa

**Para informações detalhadas sobre Supabase, consulte:**
- **[SUPABASE_WORKFLOW.md](SUPABASE_WORKFLOW.md)** - Guia completo com exemplos, troubleshooting e best practices

---

## 📝 Workflow do Git

### Quando Commitar

**Sempre commitar após:**
- Completar uma tarefa significativa
- Adicionar/modificar migrations
- Implementar uma funcionalidade completa
- Fazer correções de bugs
- Atualizar documentação importante

**Nunca commitar:**
- Código com erros
- Código incompleto ou quebrado
- Arquivos temporários ou de teste
- Credenciais ou secrets (.env.local já está no .gitignore)

### Como Commitar

**⚠️ REGRA CRÍTICA: Sempre perguntar ao usuário antes de commitar!**

```bash
# Formato de mensagem de commit (Conventional Commits)
<tipo>: <descrição curta>

# Tipos comuns:
# feat: Nova funcionalidade
# fix: Correção de bug
# refactor: Refatoração de código
# docs: Documentação
# style: Formatação, espaços
# test: Testes
# chore: Tarefas de manutenção

# Exemplos:
git commit -m "feat: add user preferences column to tasks"
git commit -m "fix: resolve task list empty state issue"
git commit -m "docs: update Supabase workflow documentation"
```

**Fluxo de commit:**

1. **Verificar mudanças:**
   ```bash
   git status
   git diff
   ```

2. **Perguntar ao usuário:** "Deseja commitar as mudanças no GitHub?"

3. **Se sim, commitar:**
   ```bash
   git add .
   git commit -m "feat: descrição das mudanças

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>"
   git push
   ```

4. **Se não, continuar trabalhando**

---

## 📊 Gestão de Tarefas e Progresso

### Atualizar projectplan.md

**⚠️ REGRA OBRIGATÓRIA: Sempre atualizar projectplan.md ao completar tarefas!**

#### Formato de Atualização

```markdown
### YYYY-MM-DD

#### Nome da Tarefa/Feature Implementada
- ✅ **Descrição Resumida:**
  - Detalhes da implementação
  - Arquivos modificados
  - Mudanças realizadas
  - Resultado obtido
  - Data: DD/MM/YYYY HH:MM
```

#### Exemplo Real

```markdown
### 2025-10-02

#### Campo Weblink Adicionado às Tarefas
- ✅ **Campo Weblink Adicionado:**
  - Criado campo `weblink` (TEXT, nullable) para todas as tarefas
  - Migração SQL: `supabase/migrations/20251002200000_add_weblink_to_tasks.sql`
  - Validação de URL implementada
  - Botão "Abrir Link" ao lado do campo
  - Arquivo: `src/pages/TaskEditorFullscreen.tsx`
  - Data: 02/10/2024 17:00
```

#### Marcação de Itens Concluídos

Use checkboxes markdown:
- `- ✅` para tarefas concluídas
- `- ⏳` para tarefas em progresso
- `- ⚠️` para tarefas com problemas
- `- 📋` para tarefas planejadas

---

## 🖥️ Preview e Desenvolvimento

### Preview Local

**⚠️ REGRA CRÍTICA: Sempre manter preview rodando em http://localhost:8080**

#### Iniciar Preview

```bash
npm run dev
```

**O preview SEMPRE deve rodar em `localhost:8080`** (não usar porta aleatória).

#### Atualizar Preview

**SEMPRE atualizar o preview após fazer mudanças no projeto:**

1. Se preview está rodando → mudanças aplicam automaticamente (HMR)
2. Se preview parou → reiniciar com `npm run dev`
3. **Preservar configuração:** Sempre usar porta 8080

#### Verificar Preview

```bash
# Checar se está rodando
curl http://localhost:8080

# Ver logs do preview
# (já está rodando em background - bash 1dfa25)
```

### Build do Projeto

```bash
# Build de produção
npm run build

# Build de desenvolvimento
npm run build:dev

# Preview do build
npm run preview
```

---

## 🎭 Testes Automatizados com MCP Playwright

### Capacidades de Teste Disponíveis

**Claude Code tem acesso ao MCP Playwright** para testar o aplicativo de forma automatizada durante o desenvolvimento.

### Quando Usar Playwright

**⚠️ REGRA: Use Playwright para validar mudanças críticas**

Use testes automatizados quando:
- Implementar novas funcionalidades importantes
- Corrigir bugs críticos que afetam UI/UX
- Fazer refatorações que podem quebrar fluxos existentes
- Validar formulários complexos
- Testar fluxos de aprovação e autenticação
- Verificar responsividade e acessibilidade

### Ferramentas Disponíveis

#### 1. Navegação
```typescript
// Navegar para página específica
mcp__MCP_DOCKER__browser_navigate({ url: "http://localhost:8080/tasks" })

// Voltar para página anterior
mcp__MCP_DOCKER__browser_navigate_back()
```

#### 2. Inspeção de Página
```typescript
// Capturar snapshot de acessibilidade (melhor que screenshot para testes)
mcp__MCP_DOCKER__browser_snapshot()

// Tirar screenshot visual
mcp__MCP_DOCKER__browser_take_screenshot({
  filename: "task-approval-page.png",
  fullPage: true
})

// Ver logs do console
mcp__MCP_DOCKER__browser_console_messages()

// Ver requisições de rede
mcp__MCP_DOCKER__browser_network_requests()
```

#### 3. Interações
```typescript
// Clicar em elementos
mcp__MCP_DOCKER__browser_click({
  element: "Botão Processar Aprovação",
  ref: "button[data-testid='process-approval']"
})

// Digitar texto
mcp__MCP_DOCKER__browser_type({
  element: "Campo de justificativa",
  ref: "textarea#justification",
  text: "Aprovado conforme critérios",
  submit: false
})

// Preencher formulários completos
mcp__MCP_DOCKER__browser_fill_form({
  fields: [
    { name: "Email", type: "textbox", ref: "input[name='email']", value: "test@example.com" },
    { name: "Aceitar termos", type: "checkbox", ref: "input[type='checkbox']", value: "true" }
  ]
})

// Selecionar opções em dropdown
mcp__MCP_DOCKER__browser_select_option({
  element: "Prioridade",
  ref: "select#priority",
  values: ["high"]
})

// Hover sobre elementos
mcp__MCP_DOCKER__browser_hover({
  element: "Menu de ações",
  ref: "button.actions-menu"
})
```

#### 4. Avaliação de JavaScript
```typescript
// Executar código JavaScript na página
mcp__MCP_DOCKER__browser_evaluate({
  function: "() => { return document.title; }"
})

// Executar código em elemento específico
mcp__MCP_DOCKER__browser_evaluate({
  element: "Tabela de tarefas",
  ref: "table.tasks",
  function: "(element) => { return element.rows.length; }"
})
```

#### 5. Gerenciamento de Abas
```typescript
// Listar todas as abas abertas
mcp__MCP_DOCKER__browser_tabs({ action: "list" })

// Abrir nova aba
mcp__MCP_DOCKER__browser_tabs({ action: "new" })

// Mudar para outra aba
mcp__MCP_DOCKER__browser_tabs({ action: "select", index: 1 })

// Fechar aba
mcp__MCP_DOCKER__browser_tabs({ action: "close", index: 0 })
```

### Fluxo de Teste Recomendado

#### Exemplo: Testar Página de Processamento de Aprovação

```typescript
// 1. Navegar para a aplicação
await browser_navigate({ url: "http://localhost:8080" })

// 2. Capturar estado inicial
await browser_snapshot()

// 3. Fazer login (se necessário)
await browser_fill_form({
  fields: [
    { name: "Email", type: "textbox", ref: "input[name='email']", value: "admin@aksell.com" },
    { name: "Senha", type: "textbox", ref: "input[type='password']", value: "senha123" }
  ]
})
await browser_click({ element: "Botão Login", ref: "button[type='submit']" })

// 4. Navegar para lista de tarefas
await browser_navigate({ url: "http://localhost:8080/tasks" })

// 5. Clicar em "Processar Aprovação"
await browser_click({ element: "Processar Aprovação", ref: "button:has-text('Processar Aprovação')" })

// 6. Verificar se página carregou sem erros
const snapshot = await browser_snapshot()
const consoleErrors = await browser_console_messages()

// 7. Preencher formulário de decisão
await browser_type({
  element: "Justificativa",
  ref: "textarea#justification",
  text: "Aprovado após análise dos critérios"
})

// 8. Clicar em Aprovar
await browser_click({ element: "Botão Aprovar", ref: "button:has-text('Aprovar')" })

// 9. Tirar screenshot do resultado
await browser_take_screenshot({ filename: "approval-success.png" })

// 10. Verificar mensagem de sucesso
const finalSnapshot = await browser_snapshot()
```

### Boas Práticas

#### ✅ SEMPRE Fazer

1. **Capturar snapshot antes e depois** de interações importantes
2. **Verificar console logs** para detectar erros JavaScript
3. **Tirar screenshots** de estados críticos para documentação
4. **Aguardar carregamento** antes de interagir com elementos
5. **Validar mensagens de erro/sucesso** após ações
6. **Verificar requisições de rede** para debugging de API

#### ❌ NUNCA Fazer

1. **Assumir que elemento existe** sem verificar snapshot
2. **Interagir muito rápido** sem dar tempo para renderização
3. **Ignorar erros do console** - sempre verificar logs
4. **Testar em produção** - sempre usar localhost:8080
5. **Esquecer de fechar browser** após testes

### Quando Reportar Resultados

**Sempre reportar ao usuário:**
- Screenshots de estados importantes
- Erros encontrados no console
- Tempo de carregamento de páginas críticas
- Comportamento inesperado da UI
- Sugestões de melhorias de UX baseadas nos testes

### Troubleshooting

#### Elemento não encontrado
```typescript
// 1. Capturar snapshot para ver elementos disponíveis
const snapshot = await browser_snapshot()

// 2. Usar seletores mais específicos
// ❌ Ruim: "button"
// ✅ Bom: "button[data-testid='submit']" ou "button:has-text('Enviar')"
```

#### Página não carrega
```typescript
// 1. Verificar se preview está rodando
curl http://localhost:8080

// 2. Ver logs do console
const logs = await browser_console_messages()

// 3. Ver requisições de rede
const requests = await browser_network_requests()
```

#### Testes lentos
```typescript
// 1. Usar snapshot ao invés de screenshot quando possível
// 2. Evitar fullPage screenshots se não necessário
// 3. Limitar número de verificações
```

### Integração com Workflow

**Fluxo recomendado ao implementar features:**

1. **Implementar código** → Escrever funcionalidade
2. **Testar manualmente** → Verificar no browser
3. **Testar com Playwright** → Validar fluxo automaticamente
4. **Documentar em projectplan.md** → Registrar mudanças
5. **Commitar (após perguntar)** → Salvar no git

### Credenciais de Teste para Playwright

**⚠️ IMPORTANTE: Usar apenas para testes automatizados via Playwright**

Para testar funcionalidades que requerem autenticação:

- **Email:** `junior@aksell.com.br`
- **Senha:** `tmL!DNVPA843+h?UGpwphCCXhtjACd`
- **2FA:** Clicar em "Cancelar" quando aparecer (sistema permite prosseguir)

**Exemplo de login automatizado:**

```typescript
// Navegar para página de login
await browser_navigate({ url: "http://localhost:8080/auth" })

// Preencher credenciais
await browser_type({
  element: "Campo Email",
  ref: "input[name='email']",
  text: "junior@aksell.com.br"
})

await browser_type({
  element: "Campo Senha",
  ref: "input[type='password']",
  text: "tmL!DNVPA843+h?UGpwphCCXhtjACd"
})

// Clicar em Entrar
await browser_click({
  element: "Botão Entrar",
  ref: "button:has-text('Entrar')"
})

// Aguardar e clicar em Cancelar no 2FA (se aparecer)
await browser_wait_for({ time: 2 })
await browser_click({
  element: "Cancelar 2FA",
  ref: "button:has-text('Cancelar')"
})
```

---

## 🛠️ Comandos Úteis

### NPM Scripts

```bash
# Desenvolvimento
npm run dev                    # Inicia servidor de desenvolvimento (porta 8080)
npm run build                  # Build de produção
npm run build:dev              # Build de desenvolvimento
npm run preview                # Preview do build
npm run lint                   # Linter (ESLint)

# Supabase
npm run supabase:sql           # Executa SQL via API
npm run supabase:migration     # Cria nova migration
```

### Supabase CLI

```bash
# Configurar token (em cada sessão)
export SUPABASE_ACCESS_TOKEN="sbp_5cf553b4fa254419f4738c57b476d9a70a7c0189"

# Status do projeto
npx supabase status

# Migrations
npx supabase migration new nome
npx supabase migration list --linked
npx supabase db push

# Edge Functions
npx supabase functions deploy nome-funcao --project-ref nahyrexnxhzutfeqxjte
npx supabase functions logs nome-funcao --project-ref nahyrexnxhzutfeqxjte

# Secrets
npx supabase secrets set KEY=value --project-ref nahyrexnxhzutfeqxjte
npx supabase secrets list --project-ref nahyrexnxhzutfeqxjte
```

### Queries SQL Úteis

```bash
# Ver todas as tabelas
npm run supabase:sql "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"

# Ver colunas de uma tabela
npm run supabase:sql "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tasks';"

# Ver migrations aplicadas
npm run supabase:sql "SELECT version FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 10;"

# Contar registros
npm run supabase:sql "SELECT COUNT(*) FROM tasks;"
```

---

## ⚡ Regras Importantes

### ✅ SEMPRE Fazer

1. **Manter preview rodando em localhost:8080**
2. **Atualizar projectplan.md ao completar tarefas** com data/hora
3. **Perguntar antes de commitar** no GitHub
4. **Documentar migrations** em `supabase/migrations/README.md`
5. **Usar método recomendado** (Management API) para SQL
6. **Testar mudanças** antes de finalizar
7. **Usar MCP Playwright** para validar mudanças críticas em fluxos importantes
8. **Ler documentação** em `SUPABASE_WORKFLOW.md` quando necessário

### ❌ NUNCA Fazer

1. **Commitar sem perguntar ao usuário**
2. **Commitar arquivos .env.local** ou outros secrets
3. **Esquecer de atualizar projectplan.md**
4. **Deixar preview parado** ou usar porta diferente de 8080
5. **Fazer mudanças de schema** sem criar migration
6. **Aplicar migrations** sem documentar

### 📋 Checklist para Cada Tarefa

Ao completar uma tarefa, verificar:

- [ ] Código funciona corretamente
- [ ] Preview atualizado e testado (localhost:8080)
- [ ] Testes automatizados com Playwright executados (para mudanças críticas)
- [ ] Migration criada e aplicada (se mudou schema)
- [ ] Migration documentada em `supabase/migrations/README.md`
- [ ] `projectplan.md` atualizado com data/hora
- [ ] Arquivos commitados no git (após perguntar ao usuário)

---

## 📚 Documentação Adicional

### Arquivos de Referência

- **[SUPABASE_WORKFLOW.md](SUPABASE_WORKFLOW.md)** - Guia completo de Supabase
  - Credenciais e autenticação
  - Como criar migrations (3 métodos)
  - Como aplicar mudanças
  - Comandos úteis
  - Troubleshooting
  - Best practices

- **[projectplan.md](projectplan.md)** - Histórico do projeto
  - Todas as features implementadas
  - Migrações aplicadas
  - Correções de bugs
  - Atualizações de documentação

- **[supabase/migrations/README.md](supabase/migrations/README.md)** - Histórico de migrations
  - Migrations aplicadas manualmente
  - Status de cada migration
  - SQL executado

### Links Externos

- **Supabase Docs:** https://supabase.com/docs
- **Supabase CLI:** https://supabase.com/docs/guides/cli
- **Supabase Management API:** https://supabase.com/docs/reference/api
- **shadcn/ui:** https://ui.shadcn.com
- **Vite:** https://vitejs.dev

---

## 🎓 Exemplos Práticos

### Exemplo 1: Adicionar uma Nova Coluna

```bash
# 1. Criar migration
npm run supabase:migration add_archived_field

# 2. Editar arquivo (supabase/migrations/TIMESTAMP_add_archived_field.sql)
# ALTER TABLE tasks ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

# 3. Aplicar
npm run supabase:sql < supabase/migrations/TIMESTAMP_add_archived_field.sql

# 4. Documentar em supabase/migrations/README.md
# Adicionar entrada com data e descrição

# 5. Atualizar projectplan.md
# Adicionar seção com detalhes da implementação

# 6. Perguntar usuário e commitar
```

### Exemplo 2: Fazer Deploy de Edge Function

```bash
# 1. Verificar código da função em supabase/functions/nome-funcao/

# 2. Deploy
npx supabase functions deploy nome-funcao --project-ref nahyrexnxhzutfeqxjte

# 3. Configurar secrets se necessário
npx supabase secrets set API_KEY=xxx --project-ref nahyrexnxhzutfeqxjte

# 4. Testar
curl -X POST "https://nahyrexnxhzutfeqxjte.supabase.co/functions/v1/nome-funcao" \
  -H "Authorization: Bearer [anon-key]"

# 5. Documentar em projectplan.md
```

### Exemplo 3: Corrigir um Bug

```bash
# 1. Identificar e corrigir bug no código

# 2. Testar no preview (localhost:8080)

# 3. Atualizar projectplan.md
### 2024-10-02
#### Correção: Bug no formulário de tarefas
- ✅ **Problema:** Campo não salvava corretamente
- ✅ **Solução:** Ajustado validação no handleSubmit
- ✅ **Arquivo:** src/pages/TaskEditor.tsx
- Data: 02/10/2024 18:30

# 4. Perguntar usuário sobre commit

# 5. Se sim, commitar
git add .
git commit -m "fix: resolve task form validation issue"
git push
```

---

**🎉 Pronto! Este documento contém tudo que você precisa para trabalhar eficientemente no projeto Aksell Cursor.**

**Para dúvidas sobre Supabase:** Consulte [SUPABASE_WORKFLOW.md](SUPABASE_WORKFLOW.md)

**Última atualização:** 02/10/2024 por Claude Code
