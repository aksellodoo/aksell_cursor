export interface EntityTypeOption {
  value: string;
  label: string;
}

export const entityTypeOptions: EntityTypeOption[] = [
  { value: 'orgaos_publicos_controle', label: 'Órgãos Públicos e/ou de Controle' },
  { value: 'associacoes_sindicatos', label: 'Associações e Sindicatos' },
  { value: 'parceiros_externos', label: 'Parceiros Externos (sem vínculo comercial direto)' }
];

// Legacy options for backward compatibility
export const entityTypeLegacyOptions: EntityTypeOption[] = [
  { value: 'consultorias_parceiros', label: 'Consultorias e Parceiros' },
  { value: 'instituicoes_financeiras', label: 'Instituições Financeiras' },
  { value: 'orgaos_publicos_controle', label: 'Órgãos Públicos/Controle' },
  { value: 'associacoes_sindicatos', label: 'Associações / Sindicatos' },
  { value: 'parcerias', label: 'Parcerias' },
  { value: 'amigos_familiares', label: 'Amigos e Familiares' }
];

export function getEntityTypeLabel(value?: string | null): string {
  if (!value) return '';
  
  // Check current entity type options first
  const currentOption = entityTypeOptions.find(opt => opt.value === value);
  if (currentOption) {
    return currentOption.label;
  }
  
  // Check legacy entity type options for backward compatibility
  const legacyOption = entityTypeLegacyOptions.find(opt => opt.value === value);
  if (legacyOption) {
    return legacyOption.label;
  }
  
  // Check contact type options for any other legacy values
  try {
    const { contactTypeOptions, getContactTypeLabel } = require('@/utils/contactTypeUtils');
    const contactOption = contactTypeOptions.find((opt: any) => opt.value === value);
    if (contactOption) {
      return getContactTypeLabel(value);
    }
  } catch (error) {
    // Fallback if contactTypeUtils is not available
  }
  
  // Last resort: return the value as-is
  return value;
}