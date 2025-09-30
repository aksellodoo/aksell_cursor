import { Contact } from '@/hooks/useContacts';

/**
 * Formata a saudação para um contato baseado no tipo de tratamento
 * @param contact - O contato a ser formatado
 * @returns A saudação formatada
 */
export function formatGreeting(contact: Contact): string {
  switch (contact.treatment_type) {
    case 'sr':
      return `Prezado(a) Sr. ${contact.name}`;
    case 'sra':
      return `Prezado(a) Sra. ${contact.name}`;
    case 'direct':
      return `Prezado(a) ${contact.name}`;
    case 'custom':
      return contact.custom_treatment 
        ? `Prezado(a) ${contact.custom_treatment} ${contact.name}`
        : `Prezado(a) ${contact.name}`;
    default:
      return `Prezado(a) ${contact.name}`;
  }
}

/**
 * Obtém o tipo de tratamento em formato legível
 * @param treatmentType - O tipo de tratamento
 * @returns O tipo de tratamento formatado
 */
export function getTreatmentTypeLabel(treatmentType: Contact['treatment_type']): string {
  switch (treatmentType) {
    case 'sr':
      return 'Sr.';
    case 'sra':
      return 'Sra.';
    case 'direct':
      return 'Nome direto';
    case 'custom':
      return 'Personalizado';
    default:
      return 'Desconhecido';
  }
}