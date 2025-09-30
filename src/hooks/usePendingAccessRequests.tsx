import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PendingAccessRequest {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  department_id?: string;
  notification_email: boolean;
  notification_app: boolean;
  notification_frequency: string;
  workflow_execution_id?: string;
  rejection_reason?: string;
  created_at: string;
  expires_at: string;
  status: string;
  is_leader?: boolean;
}

export const usePendingAccessRequests = (enabled: boolean = true) => {
  const [requests, setRequests] = useState<PendingAccessRequest[]>([]);
  const [loading, setLoading] = useState(enabled);

  const fetchRequests = async () => {
    if (!enabled) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pending_access_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        // Handle RLS errors gracefully - user might not have permission
        if (error.code === 'PGRST116' || error.message?.includes('row-level security')) {
          console.warn('User does not have permission to view access requests');
          setRequests([]);
          return;
        }
        throw error;
      }
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      // Only show toast for unexpected errors, not permission issues
      if (!error.message?.includes('row-level security')) {
        toast.error('Erro ao carregar solicitações pendentes');
      }
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    fetchRequests();

    // Realtime subscription para atualizações
    const subscription = supabase
      .channel('pending_access_requests_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'pending_access_requests' },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [enabled]);

  return {
    requests,
    loading,
    refetch: fetchRequests
  };
};