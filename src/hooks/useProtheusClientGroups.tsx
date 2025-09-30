
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClientGroup {
  group_id: string | null;
  a1_filial: string;
  a1_cod: string;
  display_name: string;
  unit_count: number;
  vendors: string[];
}

export const useProtheusClientGroups = (tableId: string) => {
  const [groups, setGroups] = useState<ClientGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_protheus_client_groups', {
        p_table_id: tableId
      });

      if (error) throw error;

      setGroups(data || []);
    } catch (err) {
      console.error('Error fetching client groups:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar grupos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tableId) {
      fetchGroups();
    }
  }, [tableId]);

  return {
    groups,
    loading,
    error,
    refreshGroups: fetchGroups
  };
};
