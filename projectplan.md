# Project Plan - Aksell Cursor

## Histórico de Alterações

### 2025-09-30

#### Limpeza de Código
- ✅ Sincronização inicial com GitHub
- ✅ Remoção de componentes antigos não utilizados:
  - `TaskEditor.tsx` (versão não-fullscreen antiga)
  - `TaskBoard.tsx` (board antigo)
  - `ModernTaskBoard.tsx` (board com drag & drop não usado)
- ✅ Limpeza de código: mantido apenas `TaskEditorFullscreen.tsx` como tela de criação/edição de tarefas

### 2025-10-01

#### Diagnóstico e Documentação do Erro da Edge Function
- ✅ **Diagnóstico do Erro:**
  - **Problema:** Ao clicar em "Sugerir com IA", erro "Edge Function failed"
  - **Causa:** Edge Function `suggest-department-icon` **NÃO está deployada** no Supabase
  - **Motivo:** Edge Functions precisam ser deployadas manualmente via Supabase CLI
  - Status atual: Função existe localmente em `supabase/functions/suggest-department-icon/`

- ✅ **Melhorias no Tratamento de Erros:**
  - Adicionado logging detalhado no console (message, status, statusText, context)
  - Mensagens de erro mais específicas:
    - "Edge Function não encontrada" → indica que precisa deployar
    - "OpenAI API key não configurada" → indica secret faltando
  - Arquivo: `src/components/DepartmentFormModal.tsx` (linhas 154-180)

- ✅ **Documentação Completa de Deploy:**
  - Criado `supabase/functions/suggest-department-icon/README.md`
  - Inclui:
    - Pré-requisitos (Supabase CLI)
    - Comandos de instalação (macOS/Windows/Linux)
    - Processo completo de deploy (4 passos)
    - Como configurar OPENAI_API_KEY
    - Testes locais com curl
    - Monitoramento de logs
    - Troubleshooting detalhado

- ⚠️ **AÇÃO NECESSÁRIA - Deploy Manual:**
  ```bash
  # 1. Instalar Supabase CLI
  brew install supabase/tap/supabase

  # 2. Login
  supabase login

  # 3. Link com projeto
  supabase link --project-ref nahyrexnxhzutfeqxjte

  # 4. Configurar secret
  supabase secrets set OPENAI_API_KEY=<sua_chave>

  # 5. Deploy da função
  supabase functions deploy suggest-department-icon
  ```

#### Correção Preview em Branco + Ajuste Ícones (68 → 67 ícones)
- ✅ **Correção Preview em Branco:**
  - **Problema:** Preview mostrava tela branca após expansão de ícones
  - **Causa:** Ícone "Tool" não existe no Lucide React (usado PenTool ou Wrench)
  - **Solução:** Removido ícone "Tool" de todos os arquivos
  - Build agora funciona corretamente ✓
  - Arquivos corrigidos:
    - `src/utils/departmentIcons.ts` - Removido import e referências ao Tool
    - `supabase/functions/suggest-department-icon/index.ts` - Removido da lista
    - `src/components/DepartmentFormModal.tsx` - Atualizado contador 68→67
  - Label de Wrench atualizado: "Manutenção" → "Manutenção/Ferramentas"

#### Correção Edge Function + Expansão de Ícones (25 → 67 ícones)
- ✅ **Correção Edge Function suggest-department-icon:**
  - Removido import relativo problemático de `errorUtils.ts`
  - Adicionada função `getErrorMessage()` inline na Edge Function
  - Implementado logging detalhado para debug:
    - Log de headers da requisição
    - Log do body completo
    - Log de status do OPENAI_API_KEY
    - Log detalhado de erros com stack trace
  - **Problema anterior:** Edge Function falhava ao ser invocada (erro "failed edge function")
  - **Solução:** Import absoluto estava causando erro no Deno runtime
  - Arquivo: `supabase/functions/suggest-department-icon/index.ts`

- ✅ **Expansão de Ícones (25 → 67 ícones):**
  - **Novos ícones adicionados (42 novos):**
    - Básicos: Home
    - Pessoas/RH: UsersRound, UserCheck, UserPlus, Contact
    - Financeiro: CreditCard, Coins, DollarSign, Receipt
    - Jurídico/Segurança: ShieldCheck, ShieldAlert, Lock, Key
    - TI/Tecnologia: Database, Settings, Cog, Zap
    - Marketing/Comunicação: Presentation, Radio, Rss, Video, Mic
    - Vendas/Comercial: Target, TrendingUp
    - Qualidade/P&D: Award
    - Documentos: FileText, Files, FolderOpen, Clipboard, Notebook, FileCheck, BookOpen, Archive, Inbox
    - Análise: BarChart, LineChart, PieChart, Activity
    - Outros: MapPin, Flag
  - **Categorização organizada:** 12 categorias para facilitar seleção
  - Arquivo: `src/utils/departmentIcons.ts` (linhas 1-240)

- ✅ **Atualização UI do Modal:**
  - Grid expandido de 5x5 para **7 colunas** (comporta 68 ícones)
  - Popover width aumentado: 320px → 420px
  - Max-height do grid: 300px → 400px
  - Título atualizado: "Selecione um ícone (68 disponíveis)"
  - Arquivo: `src/components/DepartmentFormModal.tsx` (linha 336-339)

- ✅ **System Prompt da IA atualizado:**
  - Prompt reduzido e mais organizado (categorias numeradas)
  - 67 ícones listados por categoria
  - Instruções mais claras sobre case-sensitivity
  - Wrench atualizado como "manutenção/ferramentas"
  - Arquivo: `supabase/functions/suggest-department-icon/index.ts` (linhas 84-111)

#### Campo de Ícone para Departamentos com Sugestão por IA (OpenAI GPT-4o)
- ✅ **Migration Supabase:**
  - Adicionada coluna `icon` (TEXT) na tabela `departments`
  - Valor padrão: `'Building2'`
  - Arquivo: `supabase/migrations/20251002000100_add_department_icon.sql`

- ✅ **Edge Function - Suggest Department Icon:**
  - Criada função `suggest-department-icon` usando OpenAI GPT-4o
  - Utiliza o secret `OPENAI_API_KEY` já configurado no Supabase
  - Recebe nome do departamento e retorna sugestão de ícone com:
    - `icon`: Nome do ícone Lucide React sugerido
    - `confidence`: Nível de confiança (0.0 a 1.0)
    - `reasoning`: Explicação da escolha
  - 25 ícones disponíveis: Building2, Users, Calculator, Banknote, Scale, Cpu, Server, Megaphone, ShoppingCart, Package, Truck, BadgeCheck, Briefcase, Factory, Warehouse, Store, GraduationCap, Beaker, Heart, Wrench, Hammer, Shield, Phone, Mail, Globe
  - Arquivo: `supabase/functions/suggest-department-icon/index.ts`

- ✅ **Atualização departmentIcons.ts:**
  - Adicionados 12 novos ícones (total de 25)
  - Novo `ICON_MAP`: Mapeamento de string para componente Lucide React
  - Novo `AVAILABLE_ICONS`: Array com nome, label e componente de cada ícone
  - Nova função `getIconComponent()`: Retorna componente do ícone a partir do nome
  - Arquivo: `src/utils/departmentIcons.ts`

- ✅ **Modal de Criação/Edição de Departamento:**
  - **Novo campo visual de seleção de ícone:**
    - Botão com preview do ícone atual
    - Popover com grid de 25 ícones (5x5) clicáveis
    - Campo readonly exibindo nome do ícone selecionado
    - Botão "Sugerir com IA" com ícone Sparkles
  - **Sugestão automática por IA:**
    - Auto-sugere ícone 1 segundo após usuário digitar o nome (apenas na criação)
    - Botão manual para forçar sugestão com loading state (Loader2 animado)
    - Toast mostrando ícone sugerido + explicação da IA
  - **Controle de estado:**
    - `userChangedIcon`: Rastreia se usuário alterou manualmente (desabilita auto-sugestão)
    - `loadingIconSuggestion`: Estado de loading da chamada à IA
    - `iconPopoverOpen`: Controla abertura do popover de seleção
  - Arquivo: `src/components/DepartmentFormModal.tsx` (linhas 1-27, 46-62, 68-79, 91-104, 127-174, 315-379)

- ✅ **Listagem de Departamentos:**
  - Nova coluna "Ícone" na tabela (primeira coluna)
  - Ícone renderizado dinamicamente via `getIconComponent()`
  - Ícone com classe `h-5 w-5 text-muted-foreground`
  - Fallback para 'Building2' se ícone não estiver definido
  - Arquivo: `src/pages/Departments.tsx` (linhas 6-7, 140-170)

- ✅ **Hook useDepartments:**
  - Interface `Department` atualizada com campo `icon: string`
  - Arquivo: `src/hooks/useDepartments.tsx` (linha 10)

- ✅ **Fluxo de Uso:**
  1. Usuário digita "Recursos Humanos" no campo nome
  2. IA sugere automaticamente "Users" após 1 segundo
  3. Usuário pode aceitar ou clicar no popover para escolher outro ícone
  4. Ícone é salvo no banco e exibido na listagem de departamentos
  5. Na edição, ícone atual é carregado e pode ser alterado manualmente ou por IA

#### Melhoria no Modal de Seleção de Documentos
- ✅ **Redesign completo do `DocumentSelectionModal`** inspirado na tela de Gestão de Documentos
- ✅ **Novas funcionalidades:**
  - **Abas de Acesso Rápido:**
    - 📁 Navegar: navegação tradicional por pastas
    - 🕐 Recentes: documentos acessados recentemente
    - ⭐ Favoritos: documentos marcados como favoritos
    - 📈 Populares: documentos mais acessados
  - **Visualização:**
    - Toggle Grid/List para alternar entre visualização em grade e lista
    - Cards visuais coloridos para pastas (usando FolderCard)
    - Cards informativos para documentos com ícones por tipo de arquivo
  - **Busca e Filtros:**
    - Campo de busca para filtrar documentos por nome
    - Filtro por tipo de arquivo (PDF, Imagens, Documentos, Planilhas)
    - Filtro por status (Ativo, Processando, Arquivado)
    - Botão para limpar filtros rapidamente
  - **UX Melhorada:**
    - Breadcrumb navegável para rastrear localização
    - Estados de loading e empty states informativos
    - Indicador visual de seleção (checkmark)
    - Preview do arquivo selecionado no footer
    - Suporte a dark mode
    - Animações suaves
- ✅ **Componente cresceu de 280 para 682 linhas** com muito mais funcionalidades
- ✅ Preview local atualizado automaticamente via HMR
- ✅ **Remoção do menu lateral (Tree)** para layout mais limpo
  - Navegação agora apenas via breadcrumb e cards clickáveis
  - Layout idêntico à tela de Gestão de Documentos
  - Grid ocupando toda a largura disponível (2-5 colunas responsivas)
  - Melhor aproveitamento do espaço em telas grandes
- ✅ **Remoção COMPLETA de estados de loading que ficavam travados**
  - Removido "Carregando pastas..." que podia ficar preso
  - Removido "Carregando documentos..." que podia ficar preso
  - Removido spinner de loading nas abas Recentes, Favoritos e Populares
  - Removido parâmetro `loading` da função `renderQuickAccessSection`
  - **Corrigido "Carregando..." nos FolderCards** (causa raiz do problema)
    - Mapeamento correto de `doc_count` para `documentCount`
    - Corrigido em 2 locais: grid de departamentos e grid de subpastas
  - Dados aparecem instantaneamente ou mostram empty state
  - UX mais rápida e sem travamentos
  - **Problema resolvido definitivamente - 100% sem "Carregando..."**

#### Melhorias de UI na Gestão de Documentos - 01/10/2025 15:51
- ✅ **Aplicação de Cores e Ícones dos Departamentos nos Cards:**
  - **Modificado `useDocumentTree.tsx`:**
    - Agora busca também o campo `icon` dos departamentos do banco de dados
    - Ícone é propagado para departamentos e suas pastas filhas
  - **Atualizado Interface `DocumentTreeItem`:**
    - Adicionada propriedade opcional `icon?: string`
  - **Aprimorado `FolderCard.tsx` com design visual melhorado:**
    - **Ícones corretos:** Exibe o ícone escolhido no cadastro do departamento (não mais ícone genérico)
    - **Cores aplicadas:** Usa a cor do departamento em múltiplos elementos:
      - Borda lateral esquerda colorida (accent bar de 4px)
      - Gradiente sutil de fundo com a cor do departamento (opacidade 5%)
      - Ícone colorido com a cor do departamento
      - Título do card na cor do departamento
      - Background do container do ícone com cor do departamento (15% opacidade)
    - **Herança de cor/ícone:** Pastas filhas herdam cor e ícone do departamento pai
    - **Suporte para ambos os modos:** Grid (default) e Compact
    - **Design glassmorphism:** Cards com efeito de vidro translúcido
  - **Atualizado `DocumentManagement.tsx`:**
    - Passa propriedades `color` e `icon` para todos os `FolderCard`
    - Aplicado tanto em cards de departamentos quanto de subpastas
  - **Resultado visual:**
    - Cards de departamentos agora visualmente distintos por cor
    - Fácil identificação visual através de cores e ícones personalizados
    - UI mais moderna e profissional
    - Consistência visual entre cadastro de departamento e gestão de documentos
  - Arquivos modificados:
    - `src/hooks/useDocumentTree.tsx` - Busca campo icon
    - `src/pages/DocumentManagement.tsx` - Interface + passagem de props
    - `src/components/FolderCard.tsx` - Design visual aprimorado
  - Preview local atualizado e funcionando ✓
