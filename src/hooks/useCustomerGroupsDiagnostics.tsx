import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PROTHEUS_TABLES } from '@/lib/config';

interface DiagnosticCounts {
  totalClients: number;
  totalGroups: number;
  totalMembers: number;
  lastRunInfo?: {
    id: string;
    started_at: string;
    finished_at?: string;
    new_groups_count: number;
    new_members_count: number;
  };
}

export const useCustomerGroupsDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticCounts>({
    totalClients: 0,
    totalGroups: 0,
    totalMembers: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchDiagnostics = async () => {
    try {
      setLoading(true);
      
      // Get SA1010 client count
      const { count: totalClients } = await supabase
        .from('protheus_sa1010_80f17f00')
        .select('*', { count: 'exact', head: true });

      // Get total groups count
      const { count: totalGroups } = await supabase
        .from('protheus_customer_groups')
        .select('*', { count: 'exact', head: true })
        .eq('protheus_table_id', PROTHEUS_TABLES.SA1010_CLIENTES);

      // Get total members count
      const { count: totalMembers } = await supabase
        .from('protheus_customer_group_units')
        .select('*', { count: 'exact', head: true })
        .eq('protheus_table_id', PROTHEUS_TABLES.SA1010_CLIENTES);

      // Get last run info
      const { data: lastRunData } = await supabase
        .from('protheus_group_update_runs')
        .select('*')
        .eq('protheus_table_id', PROTHEUS_TABLES.SA1010_CLIENTES)
        .order('started_at', { ascending: false })
        .limit(1);

      setDiagnostics({
        totalClients: totalClients || 0,
        totalGroups: totalGroups || 0,
        totalMembers: totalMembers || 0,
        lastRunInfo: lastRunData?.[0] || undefined,
      });
    } catch (error) {
      console.error('Erro ao buscar diagnósticos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  return {
    diagnostics,
    loading,
    refreshDiagnostics: fetchDiagnostics,
  };
};