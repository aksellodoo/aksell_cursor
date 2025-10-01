import {
  Building2,
  Banknote,
  Calculator,
  Users,
  Scale,
  Cpu,
  Server,
  Megaphone,
  ShoppingCart,
  Package,
  Truck,
  BadgeCheck,
  Briefcase,
  Factory,
  Warehouse,
  Store,
  GraduationCap,
  Beaker,
  Heart,
  Wrench,
  Hammer,
  Shield,
  Phone,
  Mail,
  Globe,
  // Novos ícones adicionados
  FileText,
  FolderOpen,
  Clipboard,
  Notebook,
  FileCheck,
  Presentation,
  Radio,
  Rss,
  Video,
  Mic,
  BarChart,
  LineChart,
  PieChart,
  TrendingUp,
  Database,
  Settings,
  Tool,
  Cog,
  Zap,
  Activity,
  UserCheck,
  UserPlus,
  UsersRound,
  Contact,
  CreditCard,
  Coins,
  DollarSign,
  Receipt,
  Lock,
  Key,
  ShieldCheck,
  ShieldAlert,
  Files,
  BookOpen,
  Archive,
  Inbox,
  Home,
  MapPin,
  Target,
  Award,
  Flag,
  LucideIcon
} from 'lucide-react';

export type DepartmentIcon = LucideIcon;

// Mapeamento de nomes de ícones para componentes
export const ICON_MAP: Record<string, LucideIcon> = {
  'Building2': Building2,
  'Banknote': Banknote,
  'Calculator': Calculator,
  'Users': Users,
  'Scale': Scale,
  'Cpu': Cpu,
  'Server': Server,
  'Megaphone': Megaphone,
  'ShoppingCart': ShoppingCart,
  'Package': Package,
  'Truck': Truck,
  'BadgeCheck': BadgeCheck,
  'Briefcase': Briefcase,
  'Factory': Factory,
  'Warehouse': Warehouse,
  'Store': Store,
  'GraduationCap': GraduationCap,
  'Beaker': Beaker,
  'Heart': Heart,
  'Wrench': Wrench,
  'Hammer': Hammer,
  'Shield': Shield,
  'Phone': Phone,
  'Mail': Mail,
  'Globe': Globe,
  // Novos ícones
  'FileText': FileText,
  'FolderOpen': FolderOpen,
  'Clipboard': Clipboard,
  'Notebook': Notebook,
  'FileCheck': FileCheck,
  'Presentation': Presentation,
  'Radio': Radio,
  'Rss': Rss,
  'Video': Video,
  'Mic': Mic,
  'BarChart': BarChart,
  'LineChart': LineChart,
  'PieChart': PieChart,
  'TrendingUp': TrendingUp,
  'Database': Database,
  'Settings': Settings,
  'Tool': Tool,
  'Cog': Cog,
  'Zap': Zap,
  'Activity': Activity,
  'UserCheck': UserCheck,
  'UserPlus': UserPlus,
  'UsersRound': UsersRound,
  'Contact': Contact,
  'CreditCard': CreditCard,
  'Coins': Coins,
  'DollarSign': DollarSign,
  'Receipt': Receipt,
  'Lock': Lock,
  'Key': Key,
  'ShieldCheck': ShieldCheck,
  'ShieldAlert': ShieldAlert,
  'Files': Files,
  'BookOpen': BookOpen,
  'Archive': Archive,
  'Inbox': Inbox,
  'Home': Home,
  'MapPin': MapPin,
  'Target': Target,
  'Award': Award,
  'Flag': Flag,
};

// Lista de todos os ícones disponíveis para seleção
export const AVAILABLE_ICONS = [
  // Básicos/Gerais
  { name: 'Building2', label: 'Prédio/Departamento', component: Building2 },
  { name: 'Home', label: 'Casa/Principal', component: Home },
  { name: 'Briefcase', label: 'Executivo/Negócios', component: Briefcase },

  // Pessoas/RH
  { name: 'Users', label: 'Pessoas/RH', component: Users },
  { name: 'UsersRound', label: 'Equipe/Grupo', component: UsersRound },
  { name: 'UserCheck', label: 'Aprovação/Validação', component: UserCheck },
  { name: 'UserPlus', label: 'Recrutamento', component: UserPlus },
  { name: 'Contact', label: 'Contato/Atendimento', component: Contact },

  // Financeiro/Contábil
  { name: 'Calculator', label: 'Contabilidade', component: Calculator },
  { name: 'Banknote', label: 'Financeiro/Fiscal', component: Banknote },
  { name: 'CreditCard', label: 'Pagamentos', component: CreditCard },
  { name: 'Coins', label: 'Tesouraria', component: Coins },
  { name: 'DollarSign', label: 'Vendas/Receita', component: DollarSign },
  { name: 'Receipt', label: 'Faturamento', component: Receipt },

  // Jurídico/Segurança
  { name: 'Scale', label: 'Jurídico/Legal', component: Scale },
  { name: 'Shield', label: 'Segurança Geral', component: Shield },
  { name: 'ShieldCheck', label: 'Proteção/Compliance', component: ShieldCheck },
  { name: 'ShieldAlert', label: 'Risco/Auditoria', component: ShieldAlert },
  { name: 'Lock', label: 'Segurança Digital', component: Lock },
  { name: 'Key', label: 'Acesso/Credenciais', component: Key },

  // TI/Tecnologia
  { name: 'Cpu', label: 'TI/Tecnologia', component: Cpu },
  { name: 'Server', label: 'Infraestrutura', component: Server },
  { name: 'Database', label: 'Dados/BI', component: Database },
  { name: 'Settings', label: 'Configuração/Admin', component: Settings },
  { name: 'Cog', label: 'Operações TI', component: Cog },
  { name: 'Zap', label: 'Automação/DevOps', component: Zap },

  // Marketing/Comunicação
  { name: 'Megaphone', label: 'Marketing', component: Megaphone },
  { name: 'Presentation', label: 'Apresentações', component: Presentation },
  { name: 'Radio', label: 'Broadcast/Mídia', component: Radio },
  { name: 'Rss', label: 'Conteúdo/Blog', component: Rss },
  { name: 'Video', label: 'Vídeo/Produção', component: Video },
  { name: 'Mic', label: 'Áudio/Podcast', component: Mic },

  // Vendas/Comercial
  { name: 'ShoppingCart', label: 'Vendas/E-commerce', component: ShoppingCart },
  { name: 'Store', label: 'Loja/Varejo', component: Store },
  { name: 'Target', label: 'Metas/Objetivos', component: Target },
  { name: 'TrendingUp', label: 'Crescimento', component: TrendingUp },

  // Operações/Logística
  { name: 'Package', label: 'Compras/Suprimentos', component: Package },
  { name: 'Truck', label: 'Logística/Transporte', component: Truck },
  { name: 'Warehouse', label: 'Armazém/Estoque', component: Warehouse },
  { name: 'Factory', label: 'Produção/Manufatura', component: Factory },
  { name: 'Tool', label: 'Ferramentas/Utilitários', component: Tool },
  { name: 'Wrench', label: 'Manutenção', component: Wrench },
  { name: 'Hammer', label: 'Obras/Construção', component: Hammer },

  // Qualidade/P&D
  { name: 'BadgeCheck', label: 'Qualidade/QA', component: BadgeCheck },
  { name: 'Beaker', label: 'Pesquisa/Lab', component: Beaker },
  { name: 'GraduationCap', label: 'Treinamento/Educação', component: GraduationCap },
  { name: 'Award', label: 'Excelência/Prêmios', component: Award },

  // Documentos/Arquivo
  { name: 'FileText', label: 'Documentos', component: FileText },
  { name: 'Files', label: 'Arquivos', component: Files },
  { name: 'FolderOpen', label: 'Pastas/Gestão Docs', component: FolderOpen },
  { name: 'Clipboard', label: 'Clipboard/Tarefas', component: Clipboard },
  { name: 'Notebook', label: 'Notas/Registro', component: Notebook },
  { name: 'FileCheck', label: 'Validação/Aprovação', component: FileCheck },
  { name: 'BookOpen', label: 'Biblioteca/Conhecimento', component: BookOpen },
  { name: 'Archive', label: 'Arquivo/Histórico', component: Archive },
  { name: 'Inbox', label: 'Entrada/Recebimento', component: Inbox },

  // Análise/Relatórios
  { name: 'BarChart', label: 'Gráficos/Relatórios', component: BarChart },
  { name: 'LineChart', label: 'Análise Temporal', component: LineChart },
  { name: 'PieChart', label: 'Distribuição', component: PieChart },
  { name: 'Activity', label: 'Atividade/Monitoramento', component: Activity },

  // Comunicação/Suporte
  { name: 'Phone', label: 'Telefone/Suporte', component: Phone },
  { name: 'Mail', label: 'Email/Correspondência', component: Mail },

  // Saúde/Bem-estar
  { name: 'Heart', label: 'Saúde/Bem-estar', component: Heart },

  // Outros
  { name: 'Globe', label: 'Internacional/Global', component: Globe },
  { name: 'MapPin', label: 'Localização/Filiais', component: MapPin },
  { name: 'Flag', label: 'Marco/Identificação', component: Flag },
];

/**
 * Returns icon component from icon name string
 */
export const getIconComponent = (iconName: string): LucideIcon => {
  return ICON_MAP[iconName] || Building2;
};

/**
 * Returns an appropriate icon for a department based on its name (fallback/legacy)
 */
export const getDepartmentIcon = (departmentName: string): LucideIcon => {
  const name = departmentName.toLowerCase();

  // Financeiro/Contábil/Fiscal
  if (name.includes('financeiro') || name.includes('contabil') || name.includes('contábil') ||
      name.includes('fiscal') || name.includes('finance') || name.includes('accounting')) {
    return Banknote;
  }

  // Contabilidade específica
  if (name.includes('contabilidade') || name.includes('controller')) {
    return Calculator;
  }

  // RH/Recursos Humanos/Pessoal
  if (name.includes('rh') || name.includes('recursos humanos') || name.includes('pessoal') ||
      name.includes('human resources') || name.includes('people')) {
    return Users;
  }

  // Jurídico/Legal
  if (name.includes('juridico') || name.includes('jurídico') || name.includes('legal') ||
      name.includes('compliance')) {
    return Scale;
  }

  // TI/Tecnologia/Informática
  if (name.includes('ti') || name.includes('tecnologia') || name.includes('informatica') ||
      name.includes('informática') || name.includes('it') || name.includes('technology') ||
      name.includes('sistemas')) {
    return name.includes('infra') || name.includes('server') ? Server : Cpu;
  }

  // Marketing/Comercial/Vendas
  if (name.includes('marketing') || name.includes('comercial') || name.includes('vendas') ||
      name.includes('sales') || name.includes('marketing')) {
    return name.includes('vendas') || name.includes('sales') ? ShoppingCart : Megaphone;
  }

  // Compras/Suprimentos/Procurement
  if (name.includes('compras') || name.includes('suprimentos') || name.includes('procurement') ||
      name.includes('purchasing')) {
    return Package;
  }

  // Logística/Expedição
  if (name.includes('logistica') || name.includes('logística') || name.includes('expedicao') ||
      name.includes('expedição') || name.includes('logistics') || name.includes('shipping')) {
    return Truck;
  }

  // Qualidade
  if (name.includes('qualidade') || name.includes('quality') || name.includes('qa') ||
      name.includes('qc')) {
    return BadgeCheck;
  }

  // Diretoria/Administração
  if (name.includes('diretoria') || name.includes('administracao') || name.includes('administração') ||
      name.includes('administration') || name.includes('executive') || name.includes('board')) {
    return Briefcase;
  }

  // Produção/Manufatura
  if (name.includes('producao') || name.includes('produção') || name.includes('manufatura') ||
      name.includes('fabrica') || name.includes('fábrica')) {
    return Factory;
  }

  // Armazém/Estoque
  if (name.includes('armazem') || name.includes('armazém') || name.includes('estoque') ||
      name.includes('warehouse') || name.includes('inventory')) {
    return Warehouse;
  }

  // Default
  return Building2;
};