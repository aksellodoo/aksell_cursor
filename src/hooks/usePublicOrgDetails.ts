import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSupabaseErrorMessage } from '@/utils/supabaseErrors';
import { toast } from 'sonner';

export interface PublicOrgDetails {
  id?: string;
  contact_entity_id: string;
  official_name: string;
  acronym?: string;
  governmental_sphere?: 'municipal' | 'estadual' | 'federal' | 'internacional';
  organ_type?: 'regulador' | 'fiscalizador' | 'policia' | 'ministerio' | 'prefeitura' | 'outro';
  activity_areas?: string[];
  cnpj?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  city_id?: string;
  cep?: string;
  website?: string;
  regional_unit?: string;
  relation_type?: 'fiscalizacao' | 'registro_certificacao' | 'autorizacao' | 'licenciamento' | 'outros';
  relation_detail?: string;
  responsible_user_id?: string;
  responsible_department_id?: string;
  status?: 'regular' | 'pendente' | 'em_fiscalizacao' | 'em_auditoria' | 'outro';
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export const usePublicOrgDetails = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const getByEntityId = async (contactEntityId: string): Promise<PublicOrgDetails | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('contact_entity_public_orgs')
        .select('*')
        .eq('contact_entity_id', contactEntityId)
        .maybeSingle();

      if (error) throw error;
      
      return data as PublicOrgDetails | null;
    } catch (err) {
      console.error('Error fetching public org details:', err);
      const errorMessage = getSupabaseErrorMessage(err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const upsert = async (details: Omit<PublicOrgDetails, 'id' | 'created_at' | 'updated_at'>): Promise<PublicOrgDetails | null> => {
    try {
      setLoading(true);
      setError(null);

      // Normalize CNPJ to only digits and sanitize UUID fields
      const normalizedDetails = {
        ...details,
        cnpj: details.cnpj ? details.cnpj.replace(/[^0-9]/g, '') : undefined,
        created_by: details.created_by || undefined,
        city_id: details.city_id || undefined,
        responsible_user_id: details.responsible_user_id || undefined,
        responsible_department_id: details.responsible_department_id || undefined
      };

      const { data, error } = await supabase
        .from('contact_entity_public_orgs')
        .upsert(normalizedDetails, { 
          onConflict: 'contact_entity_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Detalhes do órgão público salvos com sucesso');
      return data as PublicOrgDetails;
    } catch (err) {
      console.error('Error upserting public org details:', err);
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
        .from('contact_entity_public_orgs')
        .delete()
        .eq('contact_entity_id', contactEntityId);

      if (error) throw error;

      toast.success('Detalhes do órgão público removidos');
      return true;
    } catch (err) {
      console.error('Error deleting public org details:', err);
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
};