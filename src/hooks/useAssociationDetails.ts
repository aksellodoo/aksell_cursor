import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSupabaseErrorMessage } from '@/utils/supabaseErrors';
import { toast } from 'sonner';

export interface AssociationDetails {
  id: string;
  contact_entity_id: string;
  official_name: string;
  acronym?: string;
  association_type?: string;
  activity_area?: string;
  cnpj?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  city_id?: string;
  cep?: string;
  website?: string;
  regional_unit?: string;
  company_relationship_types?: string[];
  participation_level?: string;
  responsible_user_id?: string;
  responsible_department_id?: string;
  current_status?: string;
  interaction_history?: string;
  has_financial_contributions?: boolean;
  contribution_amount?: number;
  contribution_frequency?: string;
  affiliation_date?: string;
  association_validity_date?: string;
  created_at: string;
  updated_at: string;
}

export const useAssociationDetails = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getByEntityId = async (contactEntityId: string): Promise<AssociationDetails | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('contact_entity_associations')
        .select('*')
        .eq('contact_entity_id', contactEntityId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as AssociationDetails | null;
    } catch (err) {
      console.error('Error fetching association details:', err);
      const errorMessage = getSupabaseErrorMessage(err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const upsert = async (details: Omit<AssociationDetails, 'id' | 'created_at' | 'updated_at'>): Promise<AssociationDetails | null> => {
    try {
      setLoading(true);
      setError(null);

      // Sanitize data: convert empty strings to null for dates and UUID fields
      const sanitizedDetails = {
        ...details,
        affiliation_date: details.affiliation_date === '' ? null : details.affiliation_date,
        association_validity_date: details.association_validity_date === '' ? null : details.association_validity_date,
        city_id: details.city_id || undefined,
        responsible_user_id: details.responsible_user_id || undefined,
        responsible_department_id: details.responsible_department_id || undefined
      };

      // Check if association details already exist for this entity
      const existing = await getByEntityId(details.contact_entity_id);

      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from('contact_entity_associations')
          .update(sanitizedDetails)
          .eq('contact_entity_id', details.contact_entity_id)
          .select()
          .single();

        if (error) throw error;
        toast.success('Detalhes da associação atualizados com sucesso!');
        return data as AssociationDetails;
      } else {
        // Create new record with created_by
        const { data: user } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from('contact_entity_associations')
          .insert({
            ...sanitizedDetails,
            created_by: user.user?.id
          })
          .select()
          .single();

        if (error) throw error;
        toast.success('Detalhes da associação criados com sucesso!');
        return data as AssociationDetails;
      }
    } catch (err) {
      console.error('Error upserting association details:', err);
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
        .from('contact_entity_associations')
        .delete()
        .eq('contact_entity_id', contactEntityId);

      if (error) throw error;

      toast.success('Detalhes da associação excluídos com sucesso!');
      return true;
    } catch (err) {
      console.error('Error deleting association details:', err);
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