
export interface GroupMember {
  filial: string;
  cod: string;
  loja: string;
  nome: string;
  nome_reduzido: string;
  vendor_name: string;
  unified_status: string;
}

export interface GroupLead {
  lead_id: string;
  trade_name: string;
  legal_name: string;
  assigned_vendor_cod: string;
  vendor_name: string;
  cnpj: string;
  city_name: string;
}
