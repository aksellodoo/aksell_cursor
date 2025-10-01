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
};

// Lista de todos os ícones disponíveis para seleção
export const AVAILABLE_ICONS = [
  { name: 'Building2', label: 'Prédio/Departamento', component: Building2 },
  { name: 'Users', label: 'Pessoas/RH', component: Users },
  { name: 'Calculator', label: 'Contabilidade', component: Calculator },
  { name: 'Banknote', label: 'Financeiro', component: Banknote },
  { name: 'Scale', label: 'Jurídico', component: Scale },
  { name: 'Cpu', label: 'TI/Tecnologia', component: Cpu },
  { name: 'Server', label: 'Infraestrutura', component: Server },
  { name: 'Megaphone', label: 'Marketing', component: Megaphone },
  { name: 'ShoppingCart', label: 'Vendas', component: ShoppingCart },
  { name: 'Package', label: 'Compras', component: Package },
  { name: 'Truck', label: 'Logística', component: Truck },
  { name: 'BadgeCheck', label: 'Qualidade', component: BadgeCheck },
  { name: 'Briefcase', label: 'Executivo', component: Briefcase },
  { name: 'Factory', label: 'Produção', component: Factory },
  { name: 'Warehouse', label: 'Armazém', component: Warehouse },
  { name: 'Store', label: 'Loja/Varejo', component: Store },
  { name: 'GraduationCap', label: 'Treinamento', component: GraduationCap },
  { name: 'Beaker', label: 'Pesquisa/Lab', component: Beaker },
  { name: 'Heart', label: 'Saúde', component: Heart },
  { name: 'Wrench', label: 'Manutenção', component: Wrench },
  { name: 'Hammer', label: 'Obras', component: Hammer },
  { name: 'Shield', label: 'Segurança', component: Shield },
  { name: 'Phone', label: 'Suporte', component: Phone },
  { name: 'Mail', label: 'Correspondência', component: Mail },
  { name: 'Globe', label: 'Internacional', component: Globe },
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