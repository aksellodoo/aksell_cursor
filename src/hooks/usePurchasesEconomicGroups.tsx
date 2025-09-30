import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PurchasesEconomicGroup {
  id_grupo: number;
  code: string;
  name: string;
  ai_suggested_name?: string;
  member_count: number;
  material_types?: string[];
  assigned_buyer_cod?: string;
  assigned_buyer_name?: string;
  created_at?: string;
  assigned_buyer_filial?: string;
  protheus_filial?: string;
  protheus_cod?: string;
  member_buyer_names?: string[];
  group_assigned_buyer_name?: string;
  material_type_names?: string[];
}

export interface CreateGroupResult {
  id_grupo: number;
  code: string;
  name: string;
}

export const usePurchasesEconomicGroups = () => {
  const [groups, setGroups] = useState<PurchasesEconomicGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [loadingBuyers, setLoadingBuyers] = useState(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25); // Default page size
  
  // Race condition prevention for search requests
  const requestIdRef = useState(() => ({ current: 0 }))[0];

  const fetchGroups = useCallback(async (page: number = 1, searchTerm?: string, sortBy?: string, sortOrder?: string) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching groups with params:', { page, pageSize, searchTerm, sortBy, sortOrder, requestId });
      
      // Try new RPC first, fallback to old one if it fails
      let data, error;
      
      try {
        const response = await supabase.rpc('get_purchases_economic_groups_paginated_v2', {
          p_page: page,
          p_page_size: pageSize,
          p_search_term: searchTerm || null,
          p_sort_column: sortBy || 'name',
          p_sort_direction: sortOrder || 'ASC'
        });
        data = response.data;
        error = response.error;
        console.log('Using v2 RPC successfully');
      } catch (v2Error) {
        console.warn('V2 RPC failed, trying original:', v2Error);
        
        // Fallback to original RPC
        try {
          const response = await supabase.rpc('get_purchases_economic_groups_paginated', {
            p_page: page,
            p_page_size: pageSize,
            p_search_term: searchTerm || null,
            p_sort_column: sortBy || 'name',
            p_sort_direction: sortOrder || 'ASC'
          });
          data = response.data;
          error = response.error;
          console.log('Using original RPC as fallback');
        } catch (originalError) {
          console.warn('Original RPC also failed, using client-side fallback:', originalError);
          
          // Final fallback: fetch all and paginate client-side
          const allResponse = await supabase.rpc('get_all_purchases_economic_groups');
          if (allResponse.error) {
            throw allResponse.error;
          }
          
          let allGroups = allResponse.data || [];
          
          // Apply search filter if provided
          if (searchTerm && searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            allGroups = allGroups.filter((group: any) => 
              group.name?.toLowerCase().includes(search) ||
              group.ai_suggested_name?.toLowerCase().includes(search) ||
              group.code?.toLowerCase().includes(search)
            );
          }
          
          // Apply sorting
          if (sortBy) {
            allGroups.sort((a: any, b: any) => {
              let aVal = a[sortBy] || '';
              let bVal = b[sortBy] || '';
              
              if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortOrder === 'DESC' ? bVal - aVal : aVal - bVal;
              }
              
              const strA = String(aVal).toLowerCase();
              const strB = String(bVal).toLowerCase();
              const comparison = strA.localeCompare(strB);
              return sortOrder === 'DESC' ? -comparison : comparison;
            });
          }
          
          // Calculate pagination
          const totalCount = allGroups.length;
          const offset = (page - 1) * pageSize;
          const paginatedData = allGroups.slice(offset, offset + pageSize);
          
          // Format data like RPC response
          data = paginatedData.map((group: any) => ({ ...group, total_count: totalCount }));
          error = null;
          
          console.log('Using client-side pagination fallback');
        }
      }

      // Check if this is still the most recent request
      if (requestId !== requestIdRef.current) {
        console.log('Ignoring outdated request:', requestId, 'current:', requestIdRef.current);
        return;
      }

      if (error) {
        console.error('RPC error:', error);
        throw error;
      }
      
      console.log('RPC response:', data);
      
      const transformedGroups: PurchasesEconomicGroup[] = (data || []).map((group: any) => ({
        id_grupo: group.id_grupo,
        code: group.code,
        name: group.name,
        ai_suggested_name: group.ai_suggested_name,
        member_count: group.member_count || 0,
        material_types: group.material_types || [],
        material_type_names: group.material_types || [], // Map material_types to material_type_names
        assigned_buyer_cod: group.assigned_buyer_cod,
        assigned_buyer_name: group.assigned_buyer_name,
        created_at: group.created_at
      }));

      setGroups(transformedGroups);
      
      // Set total count from the first row (all rows have the same total_count)
      if (data && data.length > 0) {
        setTotalCount(data[0].total_count || 0);
      } else {
        setTotalCount(0);
      }
      
      setCurrentPage(page);
    } catch (err) {
      // Only show error if this is still the current request
      if (requestId === requestIdRef.current) {
        console.error('Error fetching purchases economic groups:', err);
        console.error('Error details:', {
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined,
          error: err
        });
        setError(err instanceof Error ? err.message : 'Erro ao carregar grupos');
      }
    } finally {
      // Only update loading if this is still the current request
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [pageSize, requestIdRef]);

  const fetchTotalGroupsCount = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('count_purchases_economic_groups');
      
      if (error) {
        console.error('Error fetching total groups count:', error);
        return 0;
      }
      
      return data || 0;
    } catch (error) {
      console.error('Error fetching total groups count:', error);
      return 0;
    }
  }, []);

  const searchGroups = useCallback(async (searchTerm: string) => {
    // Use the unified fetchGroups function for search instead of separate RPC
    return fetchGroups(1, searchTerm, 'name', 'ASC');
  }, [fetchGroups]);

  const createGroup = useCallback(async (name?: string): Promise<CreateGroupResult> => {
    const { data, error } = await supabase.rpc('create_purchases_economic_group', {
      p_name: name || null
    });

    if (error) throw error;
    
    if (!data || data.length === 0) {
      throw new Error('Erro ao criar grupo');
    }

    // Don't refresh automatically - let the component handle it
    // await fetchGroups();
    
    return data[0];
  }, [fetchGroups]);

  const deleteGroup = useCallback(async (idGrupo: number): Promise<void> => {
    const { error } = await supabase
      .from('purchases_economic_groups')
      .delete()
      .eq('id_grupo', idGrupo);

    if (error) throw error;
    
    // Refresh groups after deletion
    await fetchGroups();
  }, [fetchGroups]);

  const fetchBuyers = useCallback(async () => {
    setLoadingBuyers(true);
    try {
      const { data, error } = await supabase
        .from('protheus_sy1010_3249e97a')
        .select('y1_cod, y1_filial, y1_nome, y1_email')
        .order('y1_nome');

      if (error) throw error;
      setBuyers(data || []);
    } catch (err) {
      console.error('Erro ao buscar compradores:', err);
    } finally {
      setLoadingBuyers(false);
    }
  }, []);

  const updateGroupDetails = useCallback(async (
    idGrupo: number, 
    name?: string, 
    assignedBuyerCod?: string, 
    assignedBuyerFilial?: string,
    protheusFilial?: string,
    protheusCod?: string
  ): Promise<boolean> => {
    const { data, error } = await supabase.rpc('update_purchases_group_details', {
      p_id_grupo: idGrupo,
      p_name: name || null,
      p_assigned_buyer_cod: assignedBuyerCod || null,
      p_assigned_buyer_filial: assignedBuyerFilial || null,
      p_protheus_filial: protheusFilial || null,
      p_protheus_cod: protheusCod || null
    });

    if (error) throw error;
    
    // Refresh groups after update
    await fetchGroups();
    return data || false;
  }, [fetchGroups]);

  const applyMaterialTypesToGroupMembers = useCallback(async (
    idGrupo: number,
    materialTypeIds: string[]
  ): Promise<{ success: boolean; applied_to_members: number }> => {
    const { data, error } = await supabase.rpc('apply_material_types_to_purchases_group_members', {
      p_id_grupo: idGrupo,
      p_material_type_ids: materialTypeIds
    });

    if (error) throw error;
    
    return data as { success: boolean; applied_to_members: number };
  }, []);

  const syncGroupMaterialTypesFromMembers = useCallback(async (
    idGrupo: number
  ): Promise<{ success: boolean; inserted: number; total_group_types: number; union_member_types: number }> => {
    const { data, error } = await supabase.rpc('sync_purchases_group_material_types_from_members', {
      p_id_grupo: idGrupo
    });

    if (error) throw error;
    
    return data as { success: boolean; inserted: number; total_group_types: number; union_member_types: number };
  }, []);

  const suggestGroupName = useCallback(async (groupId: number): Promise<{ suggestedName: string; warning?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('suggest-purchases-group-name', {
        body: { groupId }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error('Erro ao conectar com o serviço de IA');
      }
      
      return {
        suggestedName: data.suggestedName,
        warning: data.warning
      };
    } catch (err) {
      console.error('Error suggesting group name:', err);
      throw new Error('Erro ao gerar sugestão de nome');
    }
  }, []);

  const fetchAllGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.rpc('get_all_purchases_economic_groups');

      if (error) throw error;
      
      const transformedGroups: PurchasesEconomicGroup[] = (data || []).map((group: any) => ({
        id_grupo: group.id_grupo,
        code: group.code,
        name: group.name,
        ai_suggested_name: group.ai_suggested_name,
        member_count: group.member_count || 0,
        material_types: group.material_types || [],
        material_type_names: group.material_types || [],
        assigned_buyer_cod: group.assigned_buyer_cod,
        assigned_buyer_name: group.assigned_buyer_name,
        created_at: group.created_at
      }));

      setGroups(transformedGroups);
      setTotalCount(transformedGroups.length);
    } catch (err) {
      console.error('Error fetching all purchases economic groups:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar grupos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    loading,
    error,
    totalCount,
    currentPage,
    pageSize,
    setPageSize,
    refreshGroups: fetchGroups,
    fetchAllGroups,
    searchGroups,
    createGroup,
    deleteGroup,
    buyers,
    loadingBuyers,
    fetchBuyers,
    updateGroupDetails,
    suggestGroupName,
    applyMaterialTypesToGroupMembers,
    syncGroupMaterialTypesFromMembers,
    fetchTotalGroupsCount
  };
};