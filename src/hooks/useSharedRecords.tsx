
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface SharedRecord {
  id: string;
  shared_by: string;
  shared_by_name?: string;
  shared_with: string;
  shared_with_name?: string;
  record_type: string;
  record_id: string;
  record_name: string;
  permissions: string[];
  shared_at: string;
  expires_at?: string;
  expiry_condition?: any;
  status: string;
}

export const useSharedRecords = () => {
  const { user } = useAuth();
  const [sharedWithMe, setSharedWithMe] = useState<SharedRecord[]>([]);
  const [sharedByMe, setSharedByMe] = useState<SharedRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSharedRecords();
    }
  }, [user]);

  const fetchSharedRecords = async () => {
    try {
      setLoading(true);
      
      // Buscar registros compartilhados - usando LEFT JOIN para evitar erros
      const { data: sharedWithData, error: sharedWithError } = await supabase
        .from('record_shares')
        .select('*')
        .eq('status', 'active')
        .order('shared_at', { ascending: false });

      if (sharedWithError) throw sharedWithError;

      // Buscar nomes dos usuários separadamente
      const userIds = new Set<string>();
      sharedWithData?.forEach(share => {
        if (share.shared_by) userIds.add(share.shared_by);
        if (share.shared_with) userIds.add(share.shared_with);
      });

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', Array.from(userIds));

      const profilesMap = new Map(profilesData?.map(p => [p.id, p.name]) || []);

      // Processar os dados com os nomes dos usuários
      const processedSharedWith = sharedWithData?.map(share => ({
        ...share,
        shared_by_name: profilesMap.get(share.shared_by) || 'Usuário desconhecido',
        shared_with_name: profilesMap.get(share.shared_with) || 'Usuário desconhecido'
      })) || [];

      // Separar entre compartilhados comigo e por mim
      const mySharedRecords = processedSharedWith.filter(share => 
        share.shared_with === user?.id
      );

      const sharedByMeRecords = processedSharedWith.filter(share => 
        share.shared_by === user?.id
      );

      setSharedWithMe(mySharedRecords);
      setSharedByMe(sharedByMeRecords);
    } catch (error) {
      console.error('Error fetching shared records:', error);
      toast.error('Erro ao carregar registros compartilhados');
    } finally {
      setLoading(false);
    }
  };

  const shareRecord = async (
    recordType: string,
    recordId: string,
    recordName: string,
    sharedWithUserId: string,
    permissions: string[] = ['view'],
    expiresAt?: string,
    expiryCondition?: any
  ) => {
    try {
      const { error } = await supabase
        .from('record_shares')
        .insert({
          shared_by: user?.id,
          shared_with: sharedWithUserId,
          record_type: recordType,
          record_id: recordId,
          record_name: recordName,
          permissions,
          expires_at: expiresAt,
          expiry_condition: expiryCondition
        });

      if (error) throw error;

      toast.success('Registro compartilhado com sucesso');
      fetchSharedRecords();
    } catch (error) {
      console.error('Error sharing record:', error);
      toast.error('Erro ao compartilhar registro');
    }
  };

  const revokeShare = async (shareId: string) => {
    try {
      const { error } = await supabase
        .from('record_shares')
        .update({ status: 'revoked' })
        .eq('id', shareId);

      if (error) throw error;

      toast.success('Compartilhamento revogado');
      fetchSharedRecords();
    } catch (error) {
      console.error('Error revoking share:', error);
      toast.error('Erro ao revogar compartilhamento');
    }
  };

  const checkSharedAccess = async (recordType: string, recordId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .rpc('check_shared_record_access', {
          p_record_type: recordType,
          p_record_id: recordId,
          p_user_id: user?.id
        });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking shared access:', error);
      return false;
    }
  };

  return {
    sharedWithMe,
    sharedByMe,
    loading,
    shareRecord,
    revokeShare,
    checkSharedAccess,
    refetch: fetchSharedRecords
  };
};
