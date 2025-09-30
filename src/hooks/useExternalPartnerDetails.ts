import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSupabaseErrorMessage } from '@/utils/supabaseErrors';

export interface ExternalPartnerDetails {
  id: string;
  contact_entity_id: string;
  // Identification
  official_name: string;
  trade_name?: string;
  cnpj?: string;
  partner_type: 'ong' | 'universidade' | 'instituto_pesquisa' | 'camara_comercio' | 'embaixada' | 'midia' | 'evento' | 'incubadora' | 'escola_tecnica' | 'comunidade_oss' | 'outro';
  interest_areas?: string[];
  website?: string;
  official_profiles?: string[];
  
  // Framework & Compliance
  relationship_nature: ('institucional' | 'projeto' | 'patrocinio_nao_comercial' | 'doacao' | 'voluntariado' | 'divulgacao' | 'mentoria' | 'outro')[];
  relationship_nature_other?: string;
  risk_level?: 'baixo' | 'medio' | 'alto';
  nda_mou_term?: boolean;
  nda_mou_number?: string;
  nda_mou_url?: string;
  nda_mou_validity?: string;
  conflict_of_interest?: boolean;
  conflict_observation?: string;
  lgpd_basis?: 'consentimento' | 'legitimo_interesse' | 'cumprimento_obrigacao_legal' | 'protecao_vida' | 'exercicio_poder_publico' | 'interesse_legitimo';
  
  // Scope & Interactions
  relationship_objective?: string;
  kpis?: string;
  counterparts?: string;
  
  // Internal Relationship
  responsible_user_id?: string;
  responsible_department_id?: string;
  internal_areas?: string[];
  relevance?: 'estrategico' | 'tatico' | 'ocasional';
  status?: 'ativo' | 'pausado' | 'encerrado' | 'avaliando';
  
  // Address & Channels
  city_id?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  cep?: string;
  generic_email?: string;
  phone?: string;
  contact_form_url?: string;
  media_kit_url?: string;
  
  // Documents & Evidence
  drive_link?: string;
  
  created_at?: string;
  updated_at?: string;
}

export function useExternalPartnerDetails() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getByEntityId = async (contactEntityId: string): Promise<ExternalPartnerDetails | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('contact_entity_external_partners')
        .select('*')
        .eq('contact_entity_id', contactEntityId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      const errorMessage = getSupabaseErrorMessage(err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const upsert = async (details: Omit<ExternalPartnerDetails, 'id' | 'created_at' | 'updated_at'>): Promise<ExternalPartnerDetails | null> => {
    try {
      setLoading(true);
      setError(null);

      // Sanitize data: convert empty strings to null for dates and UUID fields
      const sanitizedDetails = {
        ...details,
        nda_mou_validity: details.nda_mou_validity === '' ? null : details.nda_mou_validity,
        city_id: details.city_id || undefined,
        responsible_user_id: details.responsible_user_id || undefined,
        responsible_department_id: details.responsible_department_id || undefined,
        // Clear NDA related fields if nda_mou_term is false
        ...(details.nda_mou_term === false && {
          nda_mou_number: null,
          nda_mou_url: null,
          nda_mou_validity: null,
        }),
      };

      // Check if record exists first
      const { data: existing } = await supabase
        .from('contact_entity_external_partners')
        .select('id')
        .eq('contact_entity_id', details.contact_entity_id)
        .maybeSingle();

      let result;
      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from('contact_entity_external_partners')
          .update(sanitizedDetails)
          .eq('contact_entity_id', details.contact_entity_id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Insert new record with created_by
        const { data: user } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from('contact_entity_external_partners')
          .insert({
            ...sanitizedDetails,
            created_by: user.user?.id
          })
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      return result;
    } catch (err) {
      const errorMessage = getSupabaseErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteByEntityId = async (contactEntityId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('contact_entity_external_partners')
        .delete()
        .eq('contact_entity_id', contactEntityId);

      if (error) throw error;
      return true;
    } catch (err) {
      const errorMessage = getSupabaseErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getByEntityId,
    upsert,
    deleteByEntityId
  };
}