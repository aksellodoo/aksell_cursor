import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  department_id?: string;
  status: string;
  is_leader: boolean;
  company_relationship?: string;
  supervisor_id?: string;
  supervisor?: {
    id: string;
    name: string;
    email: string;
  };
}

export const useProfiles = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          supervisor:supervisor_id(
            id,
            name,
            email
          )
        `)
        .eq('status', 'active')
        .not('email', 'ilike', '%test%')
        .not('name', 'ilike', '%[TEST]%')
        .order('name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  return {
    profiles,
    loading,
    refetch: fetchProfiles
  };
};