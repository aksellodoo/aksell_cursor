import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PurchasesGroupMember {
  unified_id: string;
  display_name: string;
  trade_name?: string;
  legal_name?: string;
  cnpj?: string;
  unified_status: string;
  protheus_filial?: string;
  protheus_cod?: string;
  protheus_loja?: string;
  assigned_buyer_cod?: string;
  assigned_buyer_filial?: string;
  assigned_buyer_name?: string;
  city_name?: string;
  city_uf?: string;
  city_label?: string;
  distance_km_to_indaiatuba?: number;
}

export const usePurchasesGroupMembers = () => {
  const [members, setMembers] = useState<PurchasesGroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async (groupId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.rpc('get_purchases_group_members', {
        p_id_grupo: groupId
      });

      if (error) throw error;
      
      setMembers(data || []);
    } catch (err) {
      console.error('Error fetching group members:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar membros');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateGroupName = useCallback(async (groupId: number, name: string) => {
    const { data, error } = await supabase.rpc('update_purchases_group_name', {
      p_id_grupo: groupId,
      p_name: name
    });

    if (error) throw error;
    
    return data;
  }, []);

  return {
    members,
    loading,
    error,
    fetchMembers,
    updateGroupName
  };
};