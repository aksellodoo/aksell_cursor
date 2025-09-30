// Catálogo central de páginas/menus do sistema para o modal de permissões
// Mantenha os rótulos (label) consistentes com a navegação do app (Português)

export interface SystemNavItem {
  key: string;
  label: string;
  group: string;
  url?: string;
  aliases?: string[]; // labels alternativos usados historicamente
  children?: SystemNavItem[];
}

export const SYSTEM_MENU: SystemNavItem[] = [
  // Gestão de Tarefas
  { key: 'tasks', label: 'Tarefas', group: 'Gestão de Tarefas', url: '/tasks' },
  { key: 'forms', label: 'Formulários', group: 'Gestão de Tarefas', url: '/formularios' },
  { key: 'document_management', label: 'Gestão de Documentos', group: 'Gestão de Tarefas', url: '/gestao/documentos' },
  { key: 'automations', label: 'Automações', group: 'Gestão de Tarefas', url: '/automacoes', children: [
    { key: 'workflow_editor', label: 'Editor de Workflow', group: 'Gestão de Tarefas', url: '/automacoes/editor', aliases: ['Automação - Editor'] }
  ] },

  // Gestão
  { key: 'dashboards', label: 'Dashboards', group: 'Gestão', url: '/dashboard', aliases: ['Dashboard'] },
  { key: 'users', label: 'Usuários', group: 'Gestão', url: '/usuarios', aliases: ['Users'] },
  { key: 'departments', label: 'Departamentos', group: 'Gestão', url: '/departamentos', aliases: ['Departments'] },
  { key: 'portals', label: 'Portais', group: 'Gestão', url: '/portais', aliases: ['Portals'], children: [
    { key: 'portal_create', label: 'Criar Portal', group: 'Gestão', url: '/portais/novo', aliases: ['Portais - Novo'] }
  ] },
  { key: 'shared_records', label: 'Registros Compartilhados', group: 'Gestão', url: '/registros-compartilhados' },
  { key: 'site', label: 'Site', group: 'Gestão', children: [
    { key: 'site_products_admin', label: 'Dados do Site', group: 'Gestão', url: '/gestao/site/produtos' },
    { key: 'site_privacy_policy', label: 'Política de Privacidade', group: 'Gestão', url: '/gestao/site/politica-privacidade' }
  ] },

  // RH
  { key: 'employees', label: 'Funcionários', group: 'RH', url: '/rh/funcionarios', aliases: ['Employees', 'Funcionarios'] },
  { key: 'org_chart', label: 'Organograma', group: 'RH', url: '/rh/organograma', aliases: ['Organogram'] },

  // Protheus
  { key: 'protheus_settings', label: 'Configurações Protheus', group: 'Protheus', url: '/protheus/configuracoes', aliases: ['Configurações', 'Protheus Config', 'ProtheusConfig'] },
  { key: 'protheus_tables', label: 'Tabelas Protheus', group: 'Protheus', url: '/protheus/tabelas', aliases: ['TabelasProtheus'] },

  // Gestão de Contatos
  { key: 'contacts', label: 'Contatos', group: 'Gestão de Contatos', url: '/gestao/contatos', aliases: ['Contacts'] },

  // Documentos
  { key: 'document_search', label: 'Buscar Documentos', group: 'Documentos', url: '/documentos/buscar' },

  // Vendas
  { key: 'sales_registrations', label: 'Clientes', group: 'Vendas', url: '/vendas/cadastros', aliases: ['Cadastros', 'VendasCadastros'] },
  { key: 'vendors', label: 'Vendedores', group: 'Vendas', url: '/vendas/vendedores' },
  { key: 'sales_representatives', label: 'Representantes Comerciais', group: 'Vendas', url: '/vendas/representantes' },
  { key: 'economic_groups', label: 'Grupos Econômicos', group: 'Vendas', url: '/vendas/grupos-economicos' },

  // Logística
  { key: 'carriers', label: 'Transportadoras', group: 'Logística', url: '/logistica/transportadoras' },
  { key: 'logistics_cities', label: 'Cidades', group: 'Logística', url: '/logistica/cidades' },

  // Compras
  { key: 'purchases_registrations', label: 'Fornecedores', group: 'Compras', url: '/compras/cadastros', aliases: ['Cadastros', 'ComprasCadastros'] },
  { key: 'buyers', label: 'Compradores', group: 'Compras', url: '/compras/compradores' },
  { key: 'purchases_representatives', label: 'Representantes Comerciais', group: 'Compras', url: '/compras/representantes' },
  { key: 'potential_suppliers', label: 'Potenciais Fornecedores', group: 'Compras', url: '/compras/potenciais-fornecedores' },
  { key: 'unified_suppliers', label: 'Fornecedores Unificados', group: 'Compras', url: '/compras/fornecedores-unificados' },

  // Administração
  { key: 'permissions', label: 'Permissões de Acesso', group: 'Administração', url: '/permissions', aliases: ['Permissions', 'Permissões'] },
];

// Lista achatada de labels para compatibilidade com o modal e entradas antigas do banco
export const SYSTEM_PAGES: string[] = (() => {
  const labels = new Set<string>();

  const addItem = (item: SystemNavItem) => {
    labels.add(item.label);
    item.aliases?.forEach(a => labels.add(a));
    item.children?.forEach(child => addItem(child));
  };

  SYSTEM_MENU.forEach(addItem);
  return Array.from(labels);
})();
