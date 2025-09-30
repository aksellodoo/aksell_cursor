// Centralized route constants to ensure consistency
export const ROUTES = {
  // Public
  auth: '/auth',
  solicitarAcesso: '/solicitar-acesso',
  site: {
    home: '/site/home',
    empresa: '/site/empresa', 
    produtos: '/site/produtos',
    politicaPrivacidade: '/site/politica-privacidade'
  },

  // Dashboard
  dashboard: '/dashboard',

  // Gestão de Tarefas
  tasks: '/tasks',
  formularios: '/formularios',
  automacoes: '/automacoes',
  
  // Gestão
  usuarios: '/usuarios',
  departamentos: '/departamentos',
  portais: '/portais',
  registrosCompartilhados: '/registros-compartilhados',
  gestao: {
    documentos: '/gestao/documentos',
    contatos: '/gestao/contatos',
    site: {
      produtos: '/gestao/site/produtos',
      politicaPrivacidade: '/gestao/site/politica-privacidade'
    }
  },

  // Vendas
  vendas: {
    cadastros: '/vendas/cadastros',
    vendedores: '/vendas/vendedores',
    representantes: '/vendas/representantes',
    gruposEconomicos: '/vendas/grupos-economicos'
  },

  // Logística
  logistica: {
    transportadoras: '/logistica/transportadoras',
    cidades: '/logistica/cidades'
  },

  // Compras
  compras: {
    cadastros: '/compras/cadastros',
    compradores: '/compras/compradores',
    representantes: '/compras/representantes'
  },

  // RH
  rh: {
    funcionarios: '/rh/funcionarios',
    organograma: '/rh/organograma'
  },

  // Protheus
  protheus: {
    configuracoes: '/protheus/configuracoes',
    tabelas: '/protheus/tabelas'
  },

  // Aliases para compatibilidade
  aliases: {
    departments: '/departments',
    transportadoras: '/transportadoras',
    cidades: '/cidades'
  }
} as const;

// Helper function to build user-specific routes
export const buildUserRoute = (userId: string, action?: 'edit' | 'editar') => {
  const base = `${ROUTES.usuarios}/${userId}`;
  if (action) {
    return `${base}/${action}`;
  }
  return base;
};

// Helper function to get redirect targets
export const getRedirectTarget = (oldPath: string): string | null => {
  const redirects: Record<string, string> = {
    '/transportadoras': ROUTES.logistica.transportadoras,
    '/cidades': ROUTES.logistica.cidades,
    '/departments': ROUTES.departamentos,
  };
  
  return redirects[oldPath] || null;
};