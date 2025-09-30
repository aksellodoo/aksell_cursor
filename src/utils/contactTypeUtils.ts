
export interface ContactTypeOption {
  value: string;
  label: string;
  category: string;
  description: string;
}

export const contactTypeOptions: ContactTypeOption[] = [
  // Vendas
  { 
    value: 'vendas:clientes', 
    label: 'Clientes', 
    category: 'Vendas',
    description: 'Empresas que compram produtos/serviços da empresa.'
  },
  { 
    value: 'vendas:representantes', 
    label: 'Representantes Comerciais', 
    category: 'Vendas',
    description: 'Representantes que vendem em nome da Aksell.'
  },
  
  // Compras
  { 
    value: 'compras:fornecedores_prestadores', 
    label: 'Fornecedores / Prestadores de Serviço', 
    category: 'Compras',
    description: 'Quem fornece matérias-primas, embalagens, serviços ou insumos.'
  },
  { 
    value: 'compras:representantes_fornecedores', 
    label: 'Representantes de Fornecedores', 
    category: 'Compras',
    description: 'Representantes comerciais que atuam pelos fornecedores.'
  },
  { 
    value: 'compras:transportadoras', 
    label: 'Transportadoras', 
    category: 'Compras',
    description: 'Empresas responsáveis pelo transporte de mercadorias.'
  },
  
  // Consultoria / Parcerias
  { 
    value: 'consultoria:consultores_parceiros', 
    label: 'Consultores / Parceiros de Negócio', 
    category: 'Consultoria / Parcerias',
    description: 'Profissionais ou empresas que apoiam projetos, auditorias, consultoria técnica ou estratégica.'
  },
  { 
    value: 'consultoria:instituicoes_financeiras', 
    label: 'Instituições Financeiras', 
    category: 'Consultoria / Parcerias',
    description: 'Bancos, seguradoras, factoring, cooperativas ou demais entidades financeiras parceiras.'
  },
  
  // Institucional / Relacionamento
  { 
    value: 'institucional:funcionarios_publicos_policia_controle', 
    label: 'Funcionários Públicos / Órgãos de Controle', 
    category: 'Institucional / Relacionamento',
    description: 'Funcionários Públicos, Polícia, fiscais, órgãos reguladores e autoridades.'
  },
  { 
    value: 'institucional:associacoes_sindicatos', 
    label: 'Associações e Sindicatos', 
    category: 'Institucional / Relacionamento',
    description: 'Entidades de classe, sindicatos ou associações setoriais.'
  },
  { 
    value: 'institucional:parceiros_externos', 
    label: 'Parceiros Externos (sem vínculo comercial direto)', 
    category: 'Institucional / Relacionamento',
    description: 'Visitantes, instituições ou parceiros que não prestam serviços nem compram/vendem.'
  },
  { 
    value: 'institucional:amigos_familiares', 
    label: 'Amigos e Familiares', 
    category: 'Institucional / Relacionamento',
    description: 'Contatos pessoais ligados à empresa por vínculo social, não profissional.'
  },
];

export function getContactTypeLabel(value?: string | null): string {
  if (!value) return '-';
  
  const option = contactTypeOptions.find(opt => opt.value === value);
  return option ? `${option.category} > ${option.label}` : value;
}

export function groupContactTypeOptions() {
  const groups: Record<string, ContactTypeOption[]> = {};
  
  contactTypeOptions.forEach(option => {
    if (!groups[option.category]) {
      groups[option.category] = [];
    }
    groups[option.category].push(option);
  });
  
  return groups;
}
