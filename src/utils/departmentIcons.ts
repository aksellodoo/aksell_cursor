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
  Briefcase 
} from 'lucide-react';

export type DepartmentIcon = typeof Building2;

/**
 * Returns an appropriate icon for a department based on its name
 */
export const getDepartmentIcon = (departmentName: string): DepartmentIcon => {
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
  
  // Default
  return Building2;
};