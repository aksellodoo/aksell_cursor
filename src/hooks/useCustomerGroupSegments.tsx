
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Segment {
  id: string;
  name: string;
}

export const useCustomerGroupSegments = (groupId: number | null) => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (groupId) {
      fetchGroupSegments();
    }
  }, [groupId]);

  const fetchGroupSegments = async () => {
    if (!groupId) return;

    setLoading(true);
    try {
      // First, get the mapping of segments for this group
      const { data: mappingData, error: mappingError } = await supabase
        .from('economic_group_segments_map')
        .select('segment_id')
        .eq('group_id', groupId);

      if (mappingError) throw mappingError;

      if (!mappingData || mappingData.length === 0) {
        setSegments([]);
        return;
      }

      // Extract segment IDs
      const segmentIds = mappingData.map(item => item.segment_id);

      // Then get the actual segment details
      const { data: segmentsData, error: segmentsError } = await supabase
        .from('site_product_segments')
        .select('id, name')
        .in('id', segmentIds)
        .eq('is_active', true);

      if (segmentsError) throw segmentsError;

      const groupSegments = segmentsData?.map(segment => ({
        id: segment.id,
        name: segment.name
      })) || [];

      setSegments(groupSegments);
    } catch (error) {
      console.error('Erro ao carregar segmentos do grupo:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar segmentos do grupo",
        variant: "destructive"
      });
      setSegments([]);
    } finally {
      setLoading(false);
    }
  };

  const updateGroupSegments = async (newSegments: Segment[]) => {
    if (!groupId) return;

    try {
      // Remove todos os segmentos atuais
      const { error: deleteError } = await supabase
        .from('economic_group_segments_map')
        .delete()
        .eq('group_id', groupId);

      if (deleteError) throw deleteError;

      // Adiciona os novos segmentos
      if (newSegments.length > 0) {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;

        const { error: insertError } = await supabase
          .from('economic_group_segments_map')
          .insert(
            newSegments.map(segment => ({
              group_id: groupId,
              segment_id: segment.id,
              created_by: userId
            }))
          );

        if (insertError) throw insertError;
      }

      setSegments(newSegments);
      toast({
        title: "Sucesso",
        description: "Segmentos do grupo atualizados com sucesso"
      });
    } catch (error) {
      console.error('Erro ao atualizar segmentos do grupo:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar segmentos do grupo",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    segments,
    loading,
    updateGroupSegments,
    refreshSegments: fetchGroupSegments
  };
};
