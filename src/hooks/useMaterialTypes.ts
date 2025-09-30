import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MaterialType {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  designated_buyer_code?: string;
  designated_buyer_filial?: string;
}

export interface BuyerQueueItem {
  buyer_code: string;
  buyer_filial: string;
  order_index: number;
}

export interface CreateMaterialTypeData {
  name: string;
  color: string;
  designated_buyer_code?: string;
  designated_buyer_filial?: string;
  buyer_queue?: BuyerQueueItem[];
}

export const useMaterialTypes = () => {
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterialTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('purchases_material_types')
        .select(`
          id,
          name,
          color,
          is_active,
          created_by,
          created_at,
          updated_at,
          designated_buyer_code,
          designated_buyer_filial
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      setMaterialTypes(data || []);
    } catch (err) {
      console.error('Error fetching material types:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar tipos de materiais');
    } finally {
      setLoading(false);
    }
  }, []);

  const createMaterialType = useCallback(async (data: CreateMaterialTypeData): Promise<MaterialType> => {
    const { data: result, error } = await supabase
      .from('purchases_material_types')
      .insert({
        name: data.name,
        color: data.color,
        designated_buyer_code: data.designated_buyer_code,
        designated_buyer_filial: data.designated_buyer_filial,
      })
      .select()
      .single();

    if (error) throw error;
    
    if (!result) {
      throw new Error('Erro ao criar tipo de material');
    }

    // Insert buyer queue items if provided
    if (data.buyer_queue && data.buyer_queue.length > 0) {
      const queueItems = data.buyer_queue.map(item => ({
        material_type_id: result.id,
        buyer_code: item.buyer_code,
        buyer_filial: item.buyer_filial,
        order_index: item.order_index,
      }));

      const { error: queueError } = await supabase
        .from('purchases_material_type_buyer_queue')
        .insert(queueItems);

      if (queueError) {
        console.error('Error creating buyer queue:', queueError);
        // Don't fail the entire operation for queue errors
      }
    }

    // Refresh the list after creation
    await fetchMaterialTypes();
    
    return result;
  }, [fetchMaterialTypes]);

  const updateMaterialType = useCallback(async (id: string, data: Partial<CreateMaterialTypeData>): Promise<MaterialType> => {
    const { data: result, error } = await supabase
      .from('purchases_material_types')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    if (!result) {
      throw new Error('Erro ao atualizar tipo de material');
    }

    // Refresh the list after update
    await fetchMaterialTypes();
    
    return result;
  }, [fetchMaterialTypes]);

  const deleteMaterialType = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('purchases_material_types')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    
    // Refresh the list after deletion
    await fetchMaterialTypes();
  }, [fetchMaterialTypes]);

  useEffect(() => {
    fetchMaterialTypes();
  }, [fetchMaterialTypes]);

  return {
    materialTypes,
    loading,
    error,
    refetch: fetchMaterialTypes,
    createMaterialType,
    updateMaterialType,
    deleteMaterialType
  };
};