
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SupplierGroup {
  group_id: string | null;
  a2_filial: string;
  a2_cod: string;
  display_name: string;
  unit_count: number;
}

export const useProtheusSupplierGroups = (tableId: string) => {
  const [groups, setGroups] = useState<SupplierGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    if (!tableId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.rpc('get_protheus_supplier_groups', {
        p_table_id: tableId
      });

      if (error) throw error;
      
      setGroups(data || []);
    } catch (err) {
      console.error('Error fetching supplier groups:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar grupos');
    } finally {
      setLoading(false);
    }
  }, [tableId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    loading,
    error,
    refreshGroups: fetchGroups
  };
};
