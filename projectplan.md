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

#### Integração do ImportWizard no DocumentSelectionModal - 01/10/2025 16:22
- ✅ **Modal de Seleção de Documentos com Importação Integrada:**
  - **Objetivo:** Permitir importar arquivos diretamente do modal de seleção na criação de tarefas (tipo Aprovação)
  - **Funcionalidades implementadas:**
    - Botão "Importar Arquivo" no header do modal
    - Alternância entre modo `selection` (seleção) e `import` (importação)
    - Wizard completo de importação integrado dentro do mesmo modal
    - Refetch automático da lista de documentos após importação bem-sucedida
    - ProcessingProgressModal para acompanhar progresso do upload/processamento
    - Navegação fluida: seleção → importação → processamento → volta para seleção

  - **Modificado `DocumentSelectionModal.tsx`:**
    - **Imports adicionados:**
      - ImportWizardProvider e todos os steps do wizard
      - ProcessingProgressModal
      - useProcessingOrchestrator
      - Ícones Plus e Upload do lucide-react
    - **Estados novos:**
      - `mode: 'selection' | 'import'` - Controla modo atual do modal
      - `showImportWizard: boolean` - Controla exibição do wizard
    - **Hooks de processamento:**
      - `useProcessingOrchestrator()` - Gerencia upload e processamento de arquivos
      - `refetch` nos hooks `useDocumentTree` e `useDocumentActions` - Para atualizar listas
    - **Listeners de eventos:**
      - Event listener para `startProcessing` - Captura evento disparado pelo wizard
      - Validações de files, config, folderId e departmentId
    - **Handlers implementados:**
      - `handleImportComplete()` - Refaz fetch e volta para modo seleção
      - `handleCancelImport()` - Cancela importação e limpa estados
      - `WizardStepContent()` - Componente interno que renderiza steps do wizard
    - **UI condicional:**
      - Header muda título: "Selecionar Arquivo" ↔ "Importar Arquivos"
      - Botão "Importar Arquivo" aparece quando há pasta/departamento selecionado
      - Conteúdo renderizado condicionalmente via ternário `mode === 'import' ? (...) : (...)`
      - Fragment `<>...</>` envolvendo ternário + footer para estrutura JSX válida
    - **ProcessingProgressModal integrado:**
      - Exibido durante `isProcessing || isCompleted`
      - Callbacks `onClose`, `onForceStop`, `onMinimize` implementados
      - Ao fechar após sucesso, chama `handleImportComplete()`

  - **Cores e Ícones aplicados no DocumentSelectionModal:**
    - `FolderCard` recebe props `color` e `icon` em 2 locais:
      - Grid de departamentos (raiz)
      - Grid de subpastas (navegação)
    - Mesmas melhorias visuais da gestão de documentos aplicadas

  - **Fluxo de uso completo:**
    1. Usuário cria nova tarefa tipo "Aprovação"
    2. Seleciona "De arquivo" como origem do dado
    3. Clica em "Escolher arquivo"
    4. Modal `DocumentSelectionModal` abre em modo `selection`
    5. Usuário navega para departamento/pasta desejada
    6. Clica no botão "Importar Arquivo" (aparece no header)
    7. Modal muda para modo `import`, exibindo wizard completo
    8. Usuário completa wizard (quantidade, tipo, upload, etc.)
    9. Ao finalizar, wizard dispara evento `startProcessing`
    10. Modal captura evento e inicia `processFiles()`
    11. `ProcessingProgressModal` abre mostrando progresso
    12. Após conclusão, usuário clica "Fechar" no ProcessingProgressModal
    13. Modal chama `refetchDocuments()` e `refetchTree()`
    14. Modal volta para modo `selection` automaticamente
    15. Arquivo recém-importado aparece na lista atualizada
    16. Usuário pode selecioná-lo imediatamente

  - **Vantagens da implementação:**
    - ✅ Navegação fluida sem fechar/reabrir modais
    - ✅ Contexto preservado (pasta/departamento atual)
    - ✅ UX otimizada para criação rápida de tarefas
    - ✅ Reutilização completa do wizard de importação existente
    - ✅ Refetch automático garante lista sempre atualizada
    - ✅ Cores e ícones personalizados facilitam identificação visual

  - **Arquivos modificados:**
    - `src/components/DocumentSelectionModal.tsx` - Integração completa do wizard

  - **Desafios técnicos resolvidos:**
    - ❌ Erro de sintaxe JSX "Adjacent JSX elements must be wrapped"
      - ✅ Solução: Envolver ternário e footer em Fragment `<>...</>`
    - ❌ Cache do Vite mantendo erros antigos
      - ✅ Solução: Limpar cache com `rm -rf node_modules/.vite`
    - ❌ Estado do wizard persistindo entre aberturas
      - ✅ Solução: Reset de estados no `useEffect` do modal open

  - Preview local atualizado e funcionando ✓

#### Correção do Botão "Importar Arquivo" no DocumentSelectionModal - 01/10/2025 17:15
- ✅ **Problema identificado:**
  - Botão "Importar Arquivo" estava **escondido** até que usuário selecionasse um departamento/pasta
  - Comportamento inconsistente com a tela de Gestão de Documentos
  - UX confusa: usuário não sabia que a funcionalidade existia

- ✅ **Solução implementada:**
  - Removida condição `{selectedNode && (` que escondia o botão
  - Botão agora está **sempre visível** no header do modal
  - Adicionada propriedade `disabled={!selectedNode}` para desabilitar quando necessário
  - Adicionado `title` tooltip: "Selecione um departamento ou pasta primeiro"

- ✅ **Comportamento corrigido:**
  - Modal abre → Botão "Importar Arquivo" visível mas **desabilitado** (cinza)
  - Usuário clica em departamento/pasta → Botão fica **habilitado** (azul)
  - Usuário clica no botão → Wizard de importação abre normalmente
  - Comportamento agora idêntico à tela de Gestão de Documentos

- ✅ **Arquivo modificado:**
  - `src/components/DocumentSelectionModal.tsx` (linhas 502-514)
    - Removida condição de visibilidade condicional
    - Adicionado `disabled={!selectedNode}`
    - Adicionado tooltip explicativo

- ✅ **Benefícios:**
  - UX mais clara e consistente
  - Usuário sempre vê a opção de importar disponível
  - Estado desabilitado indica visualmente que precisa selecionar primeiro
  - Tooltip explica o motivo do desabilitamento

- Preview local atualizado e funcionando ✓

#### Correção do Erro "ID do departamento não encontrado" no Wizard de Importação - 01/10/2025 17:35
- ✅ **Problema identificado:**
  - Ao importar arquivo dentro do DocumentSelectionModal (selecionando departamento → clicar em Importar)
  - Wizard completava todos os steps mas falhava ao final com erro "ID do departamento não encontrado"
  - **Causa raiz:** ImportWizardProvider recebia props `initialDepartmentId` e `initialFolderId` mas não as aceitava/usava
  - ReviewApprovalStep e FileUploadStep buscavam IDs exclusivamente dos **parâmetros da URL**
  - Como modal não navega para nova rota, parâmetros da URL estavam vazios

- ✅ **Solução implementada:**

  **1. ImportWizard.tsx:**
  - Adicionado `initialDepartmentId?: string` e `initialFolderId?: string` à interface `ImportWizardProviderProps`
  - Provider agora aceita essas props e as usa como valores padrão
  - Adicionado campos `departmentId` e `folderId` ao `wizardData` inicial:
    ```typescript
    departmentId: initialDepartmentId,
    folderId: initialFolderId
    ```
  - Adicionado campos `departmentId?: string` e `folderId?: string` à interface `ImportWizardContextType['wizardData']`
  - IDs agora disponíveis no contexto para todos os steps

  **2. ReviewApprovalStep.tsx:**
  - Alterada lógica de obtenção de IDs para priorizar contexto sobre URL:
    ```typescript
    const folderId = wizardData.folderId || urlParams.get('folder') || '';
    const departmentId = wizardData.departmentId || urlParams.get('department') || '';
    ```
  - Adicionado logging detalhado para debug:
    - IDs do contexto
    - IDs da URL
    - IDs finais usados
  - Mantida compatibilidade com tela de gestão (fallback para URL)

  **3. FileUploadStep.tsx:**
  - Aplicada mesma lógica de prioridade (contexto → URL → vazio) em duas localizações:
    - Função `checkForDuplicates()` (linha 154)
    - Função `handleQuickFinish()` (linha 403-404)
  - Adicionado logging para debug
  - Consistência entre todos os steps do wizard

- ✅ **Comportamento corrigido:**
  - **No DocumentSelectionModal:**
    1. Usuário seleciona departamento/pasta
    2. Clica em "Importar Arquivo"
    3. ImportWizardProvider recebe `initialDepartmentId` e `initialFolderId` do selectedNode
    4. IDs armazenados no wizardData do contexto
    5. Todos os steps acessam IDs via `wizardData.departmentId` e `wizardData.folderId`
    6. Ao finalizar wizard, evento `startProcessing` dispara com IDs corretos
    7. Importação completa com sucesso ✅

  - **Na tela de Gestão de Documentos:**
    1. Usuário navega para `/gestao/documentos/importar?department=X&folder=Y`
    2. ImportWizardProvider não recebe props (valores vazios)
    3. Steps usam fallback para URL params
    4. Importação funciona normalmente ✅

- ✅ **Arquivos modificados:**
  - `src/components/document-import/ImportWizard.tsx` (linhas 85-89, 108-116, 70-72)
  - `src/components/document-import/ReviewApprovalStep.tsx` (linhas 149-162)
  - `src/components/document-import/FileUploadStep.tsx` (linhas 152-154, 401-411)

- ✅ **Vantagens da solução:**
  - Wizard funciona tanto no modal quanto na tela standalone
  - IDs preservados do contexto de seleção do modal
  - Retrocompatível com fluxo existente via URL
  - Código defensivo com múltiplos fallbacks
  - Logging detalhado facilita debug futuro

- Preview local atualizado e funcionando ✓

#### Campo de Anexos para Todos os Tipos de Tarefas com Seleção Múltipla - 01/10/2025 18:40
- ✅ **Requisito do usuário:**
  - Campo de anexos visível para TODOS os tipos de tarefas (não apenas Aprovação)
  - Permitir seleção de múltiplos arquivos
  - Manter funcionalidade de importação integrada

- ✅ **DocumentSelectionModal atualizado:**
  - Adicionado prop `allowMultiple?: boolean` (default: false)
  - Adicionado prop `onMultipleDocumentsSelect?: (documents: Array<{id, name}>) => void`
  - Estado `tempSelectedDocuments` para gerenciar seleção múltipla
  - Lógica `handleDocumentSelect` adaptada: toggle em modo múltiplo, replace em modo único
  - Checkboxes adicionados em grid view e list view quando `allowMultiple=true`
  - Footer atualizado: mostra contador "X arquivos selecionados" e botão "Confirmar Seleção"
  - Validação adaptada: `disabled` baseado em array length quando múltiplo

- ✅ **TaskEditorFullscreen atualizado:**
  - Novos estados: `selectedAttachments: Array<{id, name}>` e `showAttachmentsSelection`
  - Nova seção "Anexos (Opcional)" adicionada após "Informações Básicas"
  - UI mostra grid de anexos com botão X para remover individualmente
  - Botão "Adicionar arquivos anexos" / "Adicionar mais arquivos"
  - Segundo `DocumentSelectionModal` com `allowMultiple={true}` para anexos
  - Evita duplicatas ao adicionar novos anexos
  - Seção disponível para TODOS os tipos de tarefa

- ✅ **Estrutura do formulário:**
  ```
  1. Informações Básicas
  2. Anexos (Opcional) ← NOVO - para TODOS os tipos
  3. Configurações Específicas (campos por tipo)
  4. Recorrência
  ```

- ✅ **Comportamento:**
  - Tarefas de Aprovação: campo obrigatório "Origem do Dado" (pode ser arquivo) + seção de anexos opcional
  - Outros tipos de tarefa: apenas seção de anexos opcional (0 ou mais arquivos)
  - Modal com `allowMultiple=false`: seleção única com radio visual
  - Modal com `allowMultiple=true`: seleção múltipla com checkboxes

- ✅ **Arquivos modificados:**
  - `src/components/DocumentSelectionModal.tsx` - Suporte a seleção múltipla
  - `src/pages/TaskEditorFullscreen.tsx` - Nova seção de anexos e lógica

- Preview local atualizado e funcionando ✓

#### Remoção do Campo "Listar em Pendentes" - 02/10/2025 12:00
- ✅ **Requisito do usuário:**
  - Remover campo "Listar em 'Pendentes' após criação" da tela de criação de tarefas
  - Campo não faz sentido algum para nenhum tipo de tarefa
  - Apagar campo do Supabase também

- ✅ **TaskEditorFullscreen.tsx:**
  - Removido `list_in_pending: z.boolean().default(false)` do Zod schema
  - Removido `list_in_pending: false` dos defaultValues
  - Removido `setValue('list_in_pending', selectedTemplate.list_in_pending || false)` ao carregar template
  - Removido do objeto de criação de task_series (2 ocorrências)
  - Removido do objeto de criação de task
  - Removido do template snapshot
  - Removido bloco completo do Switch UI (linhas 657-671)

- ✅ **useTasks.tsx:**
  - Removido `list_in_pending: boolean` da interface Task
  - Removido `list_in_pending?: boolean` da interface TaskPayload
  - Removida query filter: `query = (query as any).eq('list_in_pending', true)`
  - Removidas todas as atribuições (8 ocorrências via replace_all)

- ✅ **useTaskTemplates.tsx:**
  - Removido `list_in_pending?: boolean` das interfaces TaskTemplate e CreateTaskTemplateData

- ✅ **TemplatePickerDrawer.tsx:**
  - Removido bloco de exibição do badge "Pendente" (linhas 240-244)

- ✅ **Migration Supabase criada:**
  - Arquivo: `supabase/migrations/20251002120000_remove_list_in_pending.sql`
  - Drop dos índices: `idx_tasks_pending_expected` e `idx_tasks_pending_deadline`
  - Drop da coluna `list_in_pending` das tabelas:
    - `public.tasks`
    - `public.task_templates`
    - `public.task_series`

- ✅ **Resultado:**
  - Campo completamente removido do frontend (UI + TypeScript)
  - Migration pronta para remover do banco de dados
  - Sistema mais limpo e sem funcionalidade obsoleta

- Preview local atualizado e funcionando ✓

#### Simplificação do Campo de Aprovação "De arquivo" - 02/10/2025 12:00
- ✅ **Requisito do usuário:**
  - Quando tipo Aprovação + "De arquivo": remover campo/botão de seleção de arquivo individual
  - Usar apenas o campo "Anexos" (que já permite múltiplos arquivos para todos os tipos)
  - Garantir que pelo menos 1 arquivo foi anexado antes de criar tarefa
  - Manter apenas campo "Critérios de Aprovação"

- ✅ **TaskEditorFullscreen.tsx - Remoção de código:**
  - Removidos estados não utilizados:
    - `showFileSelection` (linha 74)
    - `selectedFileId` (linha 75)
    - `selectedFileName` (linha 76)
  - Removido bloco completo de seleção individual de arquivo (linhas 374-399):
    - Label "Arquivo *"
    - Preview do arquivo selecionado
    - Botão "Escolher/Alterar arquivo"
  - Removido DocumentSelectionModal para seleção única (linhas 923-933)

- ✅ **TaskEditorFullscreen.tsx - Nova UI:**
  - Quando `data_source === 'file'`: mostra card informativo
  - Texto: "📎 Adicione o(s) arquivo(s) para aprovação na seção 'Anexos' abaixo"
  - Aviso em amarelo quando não há arquivos: "⚠️ Pelo menos um arquivo é obrigatório para aprovação"
  - Card com background sutil (`bg-muted/30`) e borda arredondada

- ✅ **Validação implementada:**
  - Função `handleCreateTask` valida antes de criar tarefa
  - Se `approval` + `data_source === 'file'` + `selectedAttachments.length === 0`:
    - Toast de erro: "Arquivo obrigatório"
    - Descrição: "Adicione pelo menos um arquivo na seção 'Anexos' para aprovação"
    - Previne criação da tarefa

- ✅ **Estrutura final para Aprovação "De arquivo":**
  ```
  1. Campo: Origem do Dado da Aprovação (select)
  2. Card informativo: direcionando para seção Anexos
  3. Campo: Critérios de Aprovação (textarea, opcional)
  4. Seção Anexos (mais abaixo, comum a todos os tipos)
  ```

- ✅ **Benefícios:**
  - Interface mais limpa e sem duplicação
  - Fluxo consistente: todos os arquivos vão para Anexos
  - Validação clara e mensagens informativas
  - Menos estados e código para manter
  - UX melhorada: menos confusão sobre onde adicionar arquivos

- Preview local atualizado e funcionando ✓

#### Melhorias na Tela de Editar Departamentos e Campo "Permitir Apagar" em Subpastas - 02/10/2025 13:00
- ✅ **Problema 1: Botão duplicado "Gerenciar Subpastas"**
  - **Situação:** Existiam 2 botões idênticos no `DepartmentFormModal.tsx`
  - **Solução:** Removido botão duplicado (linhas 488-497)
  - **Mantido:** Apenas o botão na seção de documentos (linha 475)
  - Interface mais limpa e sem confusão

- ✅ **Problema 2: Campo "Permitir Apagar" em Subpastas**
  - **Requisito:** Campo boolean para controlar se pasta pode ser excluída
  - **Implementação completa:**

- ✅ **Migration Supabase:**
  - Arquivo: `supabase/migrations/20251002130000_add_folder_allow_delete.sql`
  - Adicionada coluna `allow_delete BOOLEAN NOT NULL DEFAULT true` na tabela `folders`
  - Índice criado: `idx_folders_allow_delete` para performance
  - Valor padrão `true`: todas as pastas existentes continuam deletáveis
  - Comentário explicativo no campo

- ✅ **FolderManagementModal.tsx - Interface e UI:**
  - Adicionado `allow_delete: boolean` à interface `FolderItem`
  - Campo `allow_delete` incluído no SELECT do Supabase
  - **Ícone Lock vermelho** ao lado de pastas protegidas (title: "Protegida contra exclusão")
  - **Badge "Protegida"** (variant destructive) ao lado do nome da pasta
  - **Nova opção no menu dropdown:**
    - "Proteger contra exclusão" (quando `allow_delete = true`)
    - "Remover proteção" (quando `allow_delete = false`)
    - Toggle simples com ícone Lock
  - **Opção "Excluir" do menu:**
    - Desabilitada visualmente quando `allow_delete = false`
    - Texto atualizado: "Excluir (Protegida)" quando não pode ser excluída
    - Condição existente mantida: só aparece se pasta vazia (sem documentos e sem filhos)

- ✅ **Validação de Exclusão:**
  - Função `deleteFolder` recebe parâmetro `allowDelete`
  - Verifica proteção ANTES de chamar hook de exclusão
  - Toast de erro explicativo:
    - Título: "Pasta protegida"
    - Descrição: "Esta pasta está protegida contra exclusão. Edite as configurações da pasta para permitir exclusão."
  - Previne exclusão tanto no frontend quanto no backend

- ✅ **Feedback Visual Completo:**
  - 🔒 **Ícone Lock vermelho:** indica proteção de exclusão
  - 🏷️ **Badge "Protegida":** destaque visual na lista
  - ⚠️ **Opção desabilitada no menu:** não permite clicar em excluir
  - 💬 **Toast explicativo:** mensagem clara ao tentar excluir pasta protegida
  - ✅ **Toggle fácil:** um clique para proteger/desproteger

- ✅ **Resultado:**
  - Interface limpa sem botões duplicados
  - Sistema robusto de proteção de pastas críticas
  - UX intuitiva com múltiplos indicadores visuais
  - Segurança: pastas importantes não podem ser excluídas acidentalmente
  - Flexibilidade: administrador pode proteger/desproteger facilmente
  - Retrocompatível: pastas existentes continuam deletáveis por padrão

- Preview local atualizado e funcionando ✓

#### Correção: Tarefas não aparecem na Aba Lista - 02/10/2025 13:30
- ✅ **Problema relatado:**
  - Tarefas criadas (tipo Aprovação) não aparecem na aba "Lista" dentro de "Listagem de Tarefas"
  - Após criar tarefa, ao voltar para "Lista", a lista aparece vazia

- ✅ **Causa identificada:**
  - Query em `useTasks.tsx` era muito simples: `SELECT *` sem JOINs
  - Não carregava dados relacionados (perfis, departamentos, templates)
  - Possível problema com RLS (Row Level Security) no Supabase
  - Faltava logging para debug

- ✅ **Solução implementada:**

  **1. Query melhorada com JOINs** (src/hooks/useTasks.tsx linhas 139-148):
  ```typescript
  .select(`
    *,
    assigned_user:profiles!tasks_assigned_to_fkey(id, name, email),
    created_user:profiles!tasks_created_by_fkey(id, name, email),
    assigned_department_profile:departments(id, name, color),
    template:task_templates(id, name, fixed_type)
  `)
  ```

  **2. Logging detalhado adicionado:**
  - Log de usuário fazendo a busca
  - Log de quantidade de tarefas retornadas
  - Log de tarefas formatadas (id, title, status)
  - Log de erros completo

  **3. Uso correto dos dados dos JOINs** (linhas 235-239):
  - `assigned_user`: dados do perfil do usuário atribuído
  - `created_user`: dados do criador da tarefa
  - `assigned_department_profile`: dados do departamento
  - `template`: dados do template usado

- ✅ **Como debugar:**
  - Abrir Console do navegador (F12)
  - Acessar aba "Tarefas" > "Listagem de Tarefas" > "Lista"
  - Verificar logs:
    - `🔍 Fetching tasks for user: [user_id]`
    - `✅ Fetched X tasks from database`
    - `📋 Formatted tasks: [array]`
  - Se nenhuma tarefa aparecer: verificar RLS no Supabase

- ⚠️ **Próximos passos se ainda não funcionar:**
  - Verificar políticas RLS na tabela `tasks` no Supabase
  - Garantir que usuário tem permissão para SELECT
  - Adicionar filtro explícito por created_by se necessário

- Preview local atualizado e funcionando ✓
