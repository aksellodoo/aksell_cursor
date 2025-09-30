import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AccessRejection {
  id: string;
  requester_name: string;
  requester_email: string;
  requested_role: string;
  requested_department: string;
  rejection_reason?: string;
  rejected_by: string;
  rejected_at: string;
  created_at: string;
  rejector?: {
    name: string;
    email: string;
  };
}

export const useAccessRejections = () => {
  const [rejections, setRejections] = useState<AccessRejection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRejections = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('access_rejections')
        .select(`
          *,
          rejector:profiles(name, email)
        `)
        .order('rejected_at', { ascending: false });

      if (error) throw error;
      
      const formattedData = (data || []).map(item => {
        const hasValidRejector = (rejector: any): rejector is { name: string; email: string } => {
          return rejector && typeof rejector === 'object' && 'name' in rejector && 'email' in rejector;
        };
        
        return {
          ...item,
          rejector: hasValidRejector(item.rejector) ? item.rejector : undefined
        };
      });
      
      setRejections(formattedData);
    } catch (error) {
      console.error('Error fetching access rejections:', error);
      toast.error('Erro ao carregar rejeições de acesso');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRejections();
  }, []);

  const deleteRejection = async (id: string) => {
    try {
      const { error } = await supabase
        .from('access_rejections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Rejeição removida com sucesso');
      fetchRejections();
    } catch (error) {
      console.error('Error deleting rejection:', error);
      toast.error('Erro ao remover rejeição');
    }
  };

  return {
    rejections,
    loading,
    refetch: fetchRejections,
    deleteRejection
  };
};