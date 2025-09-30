import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAISuggest } from '@/hooks/useAISuggest';
import { 
  UnifiedGroupMember, 
  UnifiedSearchResult, 
  AddMemberResult, 
  RemoveMemberResult, 
  DeleteGroupResult 
} from '@/types/unifiedGroupTypes';

// Interface para um grupo de clientes com ID
export interface CustomerGroupWithId {
  id_grupo: number;
  group_id: string;
  filial: string | null;
  cod: string | null;
  nome_grupo: string;
  nome_grupo_sugerido?: string;
  member_count: number;
  vendor_names: string[];
  assigned_vendor_cod?: string;
  assigned_vendor_filial?: string;
  group_vendor_name?: string | null;
}

export interface UpdateGroupDetailsResult {
  success: boolean;
  error?: string;
}

// Re-export types para compatibilidade
export type { UnifiedGroupMember, UnifiedSearchResult };

export const useCustomerGroupsWithId = () => {
  const [groups, setGroups] = useState<CustomerGroupWithId[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();
  const { getSuggestion } = useAISuggest();

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.rpc('get_unified_customer_groups');

      if (error) {
        console.error('Error fetching groups:', error);
        setError(error.message);
        toast({ 
          title: "Erro", 
          description: error.message, 
          variant: "destructive" 
        });
        return;
      }

      // Buscar filial e cod dos grupos da tabela protheus_customer_groups
      const groupsWithDetails = data || [];
      
      if (groupsWithDetails.length > 0) {
        try {
          const groupIds = groupsWithDetails.map(g => g.id_grupo);
          
          const { data: groupDetails, error: detailsError } = await supabase
            .from('protheus_customer_groups')
            .select('id_grupo, filial, cod')
            .in('id_grupo', groupIds);

          if (detailsError) {
            console.error('Error fetching group details:', detailsError);
            // Continue with null values if details fetch fails
            const groupsWithFields = groupsWithDetails.map(group => ({
              ...group,
              filial: null,
              cod: null
            }));
            setGroups(groupsWithFields);
            return;
          }

          // Merge the details with the groups
          const groupsWithFields = groupsWithDetails.map(group => {
            const details = groupDetails?.find(d => d.id_grupo === group.id_grupo);
            return {
              ...group,
              filial: details?.filial || null,
              cod: details?.cod || null
            };
          });
          
          setGroups(groupsWithFields);
        } catch (err) {
          console.error('Error processing group details:', err);
          // Fallback to null values
          const groupsWithFields = groupsWithDetails.map(group => ({
            ...group,
            filial: null,
            cod: null
          }));
          setGroups(groupsWithFields);
        }
      } else {
        setGroups([]);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast({ 
        title: "Erro", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createGroup = useCallback(async (nome: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('create_economic_group', {
        p_nome_grupo: nome
      });

      if (error) {
        console.error('Error creating group:', error);
        throw error;
      }

      toast({ 
        title: "Sucesso", 
        description: "Grupo criado com sucesso", 
        variant: "default" 
      });
      
      return data;
    } catch (err) {
      console.error('Error creating group:', err);
      toast({ 
        title: "Erro", 
        description: err instanceof Error ? err.message : "Erro ao criar grupo", 
        variant: "destructive" 
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getGroupMembers = useCallback(async (idGrupo: number): Promise<UnifiedGroupMember[]> => {
    try {
      const { data, error } = await supabase.rpc('get_unified_group_members', {
        p_id_grupo: idGrupo
      });

      if (error) {
        console.error('Error fetching group members:', error);
        toast({ 
          title: "Erro", 
          description: error.message, 
          variant: "destructive" 
        });
        return [];
      }

      // Map the response to include the missing properties
      return (data || []).map((member: any) => ({
        ...member,
        commercial_name: member.display_name, // Fallback
        legal_name: member.display_name, // Fallback
      }));
    } catch (err) {
      console.error('Error fetching group members:', err);
      toast({ 
        title: "Erro", 
        description: "Erro ao buscar membros do grupo", 
        variant: "destructive" 
      });
      return [];
    }
  }, [toast]);

  const searchCustomers = useCallback(async (searchTerm: string): Promise<UnifiedSearchResult[]> => {
    const trimmedTerm = searchTerm.trim();
    if (!trimmedTerm) {
      console.debug("Termo de busca vazio, retornando array vazio");
      return [];
    }

    try {
      console.debug("Executando RPC search_unified_accounts_for_groups_simple com termo:", trimmedTerm);
      
      const { data, error } = await supabase.rpc('search_unified_accounts_for_groups_simple', {
        p_search_term: trimmedTerm
      });

      if (error) {
        console.error("Erro no RPC search_unified_accounts_for_groups_simple:", error);
        console.error("Payload enviado:", { p_search_term: trimmedTerm });
        toast({ 
          title: "Erro", 
          description: error.message, 
          variant: "destructive" 
        });
        return [];
      }

      console.debug("RPC retornou:", data?.length || 0, "resultados");
      return data || [];
    } catch (err) {
      console.error('Error searching customers:', err);
      toast({ 
        title: "Erro", 
        description: "Erro ao buscar clientes", 
        variant: "destructive" 
      });
      return [];
    }
  }, [toast]);

  const addMemberToGroup = useCallback(async (idGrupo: number, unifiedId: string): Promise<AddMemberResult> => {
    try {
      const { data, error } = await supabase.rpc('add_unified_to_group', {
        p_id_grupo: idGrupo,
        p_unified_id: unifiedId
      });

      if (error) {
        console.error('Error adding member to group:', error);
        toast({ 
          title: "Erro", 
          description: error.message, 
          variant: "destructive" 
        });
        return { success: false, error: error.message };
      }

      toast({ 
        title: "Sucesso", 
        description: "Membro adicionado ao grupo", 
        variant: "default" 
      });

      return { success: true, data };
    } catch (err) {
      console.error('Error adding member to group:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({ 
        title: "Erro", 
        description: errorMessage, 
        variant: "destructive" 
      });
      return { success: false, error: errorMessage };
    }
  }, [toast]);

  const removeMemberFromGroup = useCallback(async (idGrupo: number, unifiedId: string): Promise<RemoveMemberResult> => {
    try {
      const { data, error } = await supabase.rpc('remove_unified_from_group', {
        p_id_grupo: idGrupo,
        p_unified_id: unifiedId
      });

      if (error) {
        console.error('Error removing member from group:', error);
        toast({ 
          title: "Erro", 
          description: error.message, 
          variant: "destructive" 
        });
        return { success: false, error: error.message };
      }

      toast({ 
        title: "Sucesso", 
        description: "Membro removido do grupo", 
        variant: "default" 
      });

      return { success: true, data };
    } catch (err) {
      console.error('Error removing member from group:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({ 
        title: "Erro", 
        description: errorMessage, 
        variant: "destructive" 
      });
      return { success: false, error: errorMessage };
    }
  }, [toast]);

  const updateGroupDetails = useCallback(async (
    idGrupo: number, 
    nome?: string, 
    filial?: string, 
    cod?: string,
    assignedVendorCod?: string,
    assignedVendorFilial?: string
  ): Promise<UpdateGroupDetailsResult> => {
    try {
      setLoading(true);
      
      const updates: any = {};
      if (nome !== undefined) {
        updates.name = nome;
        updates.name_source = 'manual';
      }
      if (filial !== undefined) updates.filial = filial;
      if (cod !== undefined) updates.cod = cod;
      if (assignedVendorCod !== undefined) updates.assigned_vendor_cod = assignedVendorCod;
      if (assignedVendorFilial !== undefined) updates.assigned_vendor_filial = assignedVendorFilial;

      const { error } = await supabase
        .from('protheus_customer_groups')
        .update(updates)
        .eq('id_grupo', idGrupo);

      if (error) {
        console.error('Error updating group details:', error);
        
        if (error.code === '23505') {
          toast({ 
            title: "Erro", 
            description: "Já existe um grupo com esta combinação de Filial e Código", 
            variant: "destructive" 
          });
          return { success: false, error: "Já existe um grupo com esta combinação de Filial e Código" };
        }
        
        toast({ 
          title: "Erro", 
          description: error.message, 
          variant: "destructive" 
        });
        return { success: false, error: error.message };
      }

      toast({ 
        title: "Sucesso", 
        description: "Grupo atualizado com sucesso", 
        variant: "default" 
      });

      await fetchGroups();
      return { success: true };
    } catch (err) {
      console.error('Error updating group details:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({ 
        title: "Erro", 
        description: errorMessage, 
        variant: "destructive" 
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchGroups, toast]);

  const generateAINameSuggestion = useCallback(async (idGrupo: number) => {
    try {
      const members = await getGroupMembers(idGrupo);
      
      if (members.length === 0) {
        toast({ 
          title: "Aviso", 
          description: "Grupo sem membros para análise", 
          variant: "destructive" 
        });
        return null;
      }

      const memberNames = members.map(m => `${m.display_name} (${m.short_name})`);
      
      const prompt = `Analise os seguintes nomes de empresas de um grupo econômico e sugira um nome curto e representativo para o grupo. Ignore sufixos como ME, EPP, SA, LTDA, etc. e foque na marca/razão principal comum:

${memberNames.join('\n')}

Responda apenas com o nome sugerido, sem explicações.`;

      const result = await getSuggestion({
        sourceValues: memberNames,
        task: 'summarize',
        instructions: prompt,
        outputType: 'text'
      });

      if (result?.suggestion) {
        const { error } = await supabase.rpc('update_group_name', {
          p_id_grupo: idGrupo,
          p_nome_grupo_sugerido: result.suggestion
        });

        if (error) throw error;

        await fetchGroups();
        return result.suggestion;
      }

      return null;
    } catch (err) {
      console.error('Error generating AI name suggestion:', err);
      toast({ 
        title: "Erro", 
        description: "Erro ao gerar sugestão de nome", 
        variant: "destructive" 
      });
      return null;
    }
  }, [getGroupMembers, getSuggestion, fetchGroups, toast]);

  const updateGroupName = useCallback(async (idGrupo: number, newName: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.rpc('update_group_name', {
        p_id_grupo: idGrupo,
        p_nome_grupo: newName
      });

      if (error) {
        console.error('Error updating group name:', error);
        throw error;
      }

      await fetchGroups();
      toast({ 
        title: "Sucesso", 
        description: "Nome do grupo atualizado", 
        variant: "default" 
      });
      return { success: true };
    } catch (err) {
      console.error('Error updating group name:', err);
      toast({ 
        title: "Erro", 
        description: "Erro ao atualizar nome do grupo", 
        variant: "destructive" 
      });
      return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    } finally {
      setLoading(false);
    }
  }, [fetchGroups, toast]);

  const deleteGroup = useCallback(async (idGrupo: number): Promise<DeleteGroupResult> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('delete_economic_group', {
        p_id_grupo: idGrupo
      });

      if (error) {
        console.error('Error deleting group:', error);
        throw error;
      }

      await fetchGroups();
      toast({ 
        title: "Sucesso", 
        description: "Grupo deletado com sucesso", 
        variant: "default" 
      });
      return { success: true, data };
    } catch (err) {
      console.error('Error deleting group:', err);
      toast({ 
        title: "Erro", 
        description: "Erro ao deletar grupo", 
        variant: "destructive" 
      });
      return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    } finally {
      setLoading(false);
    }
  }, [fetchGroups, toast]);

  return {
    groups,
    loading,
    error,
    fetchGroups,
    createGroup,
    getGroupMembers,
    searchCustomers,
    addMemberToGroup,
    removeMemberFromGroup,
    generateAINameSuggestion,
    updateGroupName,
    updateGroupDetails,
    deleteGroup,
  };
};
