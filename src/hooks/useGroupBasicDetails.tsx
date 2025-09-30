import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GroupBasicDetails {
  filial: string;
  cod: string;
  vendors: string[] | null;
}

export const useGroupBasicDetails = (groupId: number | null) => {
  const [details, setDetails] = useState<GroupBasicDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchGroupDetails = async () => {
    if (!groupId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('protheus_customer_groups')
        .select('filial, cod, vendors')
        .eq('id_grupo', groupId)
        .maybeSingle();

      if (error) throw error;
      setDetails(data);
    } catch (error) {
      console.error('Erro ao buscar detalhes básicos do grupo:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateGroupBasicDetails = async (newDetails: Partial<GroupBasicDetails>) => {
    if (!groupId) return false;

    try {
      const { error } = await supabase
        .from('protheus_customer_groups')
        .update(newDetails)
        .eq('id_grupo', groupId);

      if (error) throw error;
      
      // Atualiza o estado local
      setDetails(prev => prev ? { ...prev, ...newDetails } : null);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar detalhes básicos do grupo:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  return {
    details,
    loading,
    updateGroupBasicDetails
  };
};