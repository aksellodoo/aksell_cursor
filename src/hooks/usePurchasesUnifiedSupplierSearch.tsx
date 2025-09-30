import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PurchasesUnifiedSupplier {
  unified_id: string;
  display_name: string;
  unified_status: string;
  protheus_filial?: string;
  protheus_cod?: string;
  protheus_loja?: string;
  current_group_id?: number;
  current_group_name?: string;
}

export const usePurchasesUnifiedSupplierSearch = () => {
  const [searchResults, setSearchResults] = useState<PurchasesUnifiedSupplier[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchSuppliers = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.rpc('search_purchases_unified_suppliers', {
        p_search_term: searchTerm.trim()
      });

      if (error) throw error;
      
      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching unified suppliers:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar fornecedores');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const addSupplierToGroup = useCallback(async (groupId: number, supplierId: string, materialTypeIds?: string[]) => {
    const { data, error } = await supabase.rpc('add_unified_supplier_to_purchases_group', {
      p_id_grupo: groupId,
      p_unified_id: supplierId
    });

    if (error) throw error;

    // Se tipos de material foram fornecidos, adicionar à nova tabela
    if (materialTypeIds && materialTypeIds.length > 0) {
      // Buscar o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      if (userId) {
        const materialTypeInserts = materialTypeIds.map(materialTypeId => ({
          group_id: groupId.toString(),
          material_type_id: materialTypeId,
          created_by: userId
        }));

        const { error: materialError } = await supabase
          .from('purchases_supplier_group_material_types')
          .insert(materialTypeInserts);

        if (materialError) {
          console.error('Error adding material types to group:', materialError);
          // Não falhar a operação principal, apenas log do erro
        }
      }
    }
    
    return data;
  }, []);

  const removeSupplierFromGroup = useCallback(async (groupId: number, supplierId: string) => {
    const { data, error } = await supabase.rpc('remove_unified_supplier_from_purchases_group', {
      p_id_grupo: groupId,
      p_unified_id: supplierId
    });

    if (error) throw error;
    
    return data;
  }, []);

  return {
    searchResults,
    isSearching,
    error,
    searchSuppliers,
    addSupplierToGroup,
    removeSupplierFromGroup
  };
};