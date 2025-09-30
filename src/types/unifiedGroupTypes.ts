
// Interface para membros do grupo unificado
export interface UnifiedGroupMember {
  unified_id: string;
  display_name: string;
  short_name: string;
  commercial_name: string;
  legal_name: string;
  vendor_name: string;
  unified_status: string;
  protheus_filial: string;
  protheus_cod: string;
  protheus_loja: string;
}

// Interface para resultados de busca unificada
export interface UnifiedSearchResult {
  unified_id: string;
  display_name: string;
  unified_status: string;
  protheus_filial: string;
  protheus_cod: string;
  protheus_loja: string;
  current_group_id?: number;
  current_group_name?: string;
  vendor_name: string;
}

// Interface para resultado de adição de membro
export interface AddMemberResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Interface para resultado de remoção de membro
export interface RemoveMemberResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Interface para resultado de exclusão de grupo
export interface DeleteGroupResult {
  success: boolean;
  data?: any;
  error?: string;
}
