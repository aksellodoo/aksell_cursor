
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EconomicGroup {
  id: string;
  name: string;
  member_count: number;
  unit_count: number;
  vendors: string[];
  filial: string;
  cod: string;
}

export interface EconomicGroupMember {
  id: string;
  filial: string;
  cod: string;
  display_name: string;
  unit_count: number;
  vendors: string[];
}

export interface CustomerSearchResult {
  filial: string;
  cod: string;
  nome: string;
  short_name?: string;
  current_group_number?: string;
}

const PROTHEUS_TABLES = {
  SA1010_CLIENTES: 'fc3d70f6-97ce-4997-967a-8fd92e615f99'
};

export const useCustomerEconomicGroups = (tableId: string) => {
  const [groups, setGroups] = useState<EconomicGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar grupos usando a função RPC personalizada
      const { data, error } = await supabase
        .rpc('get_protheus_client_groups' as any, { p_table_id: tableId });

      if (error) throw error;

      // Transformar dados para o formato EconomicGroup, filtrando apenas grupos criados
      const transformedGroups: EconomicGroup[] = (data || [])
        .filter((group: any) => group.group_id != null) // Só grupos realmente criados
        .map((group: any) => ({
          id: group.group_id, // Usar o ID real do grupo
          name: group.display_name || `Grupo ${group.a1_cod}`,
          member_count: 1,
          unit_count: group.unit_count || 0,
          vendors: group.vendors || [],
          filial: group.a1_filial,
          cod: group.a1_cod
        }));

      setGroups(transformedGroups);
    } catch (err) {
      console.error('Error fetching customer groups:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar grupos');
      toast({ title: "Erro", description: "Erro ao carregar grupos de clientes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };


  const updateGroupName = async (groupId: string, newName: string) => {
    try {
      // Encontrar o grupo para obter filial e cod
      const group = groups.find(g => g.id === groupId);
      if (!group) {
        throw new Error('Grupo não encontrado');
      }

      const { error } = await supabase
        .from('protheus_customer_groups')
        .upsert({
          protheus_table_id: tableId,
          filial: group.filial,
          cod: group.cod,
          name: newName,
          name_source: 'manual'
        }, { 
          onConflict: 'protheus_table_id,filial,cod' 
        });

      if (error) throw error;

      toast({ title: "Sucesso", description: "Nome do grupo atualizado com sucesso" });
      await fetchGroups();
    } catch (err) {
      console.error('Error updating group name:', err);
      toast({ title: "Erro", description: "Erro ao atualizar nome do grupo", variant: "destructive" });
      throw err;
    }
  };

  // Métodos placeholder para o modal (implementação futura)
  const getGroupMembers = async (groupId: string): Promise<EconomicGroupMember[]> => {
    // Por enquanto retorna array vazio - implementar depois
    return [];
  };

  const addGroupMember = async (groupId: string, filial: string, cod: string): Promise<void> => {
    // Implementar depois
    toast({ title: "Info", description: "Funcionalidade em desenvolvimento" });
  };

  const removeGroupMember = async (groupId: string, filial: string, cod: string): Promise<void> => {
    // Implementar depois
    toast({ title: "Info", description: "Funcionalidade em desenvolvimento" });
  };

  const searchCustomers = async (searchTerm: string): Promise<CustomerSearchResult[]> => {
    // Por enquanto retorna array vazio - implementar depois
    return [];
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
    refreshGroups: fetchGroups,
    updateGroupName,
    getGroupMembers,
    addGroupMember,
    removeGroupMember,
    searchCustomers
  };
};
