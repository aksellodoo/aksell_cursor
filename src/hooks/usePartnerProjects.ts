import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PartnerProject {
  id: string;
  partner_id: string;
  name: string;
  description?: string;
  status: 'planejado' | 'em_andamento' | 'concluido' | 'cancelado';
  start_date?: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
}

export function usePartnerProjects() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getByPartnerId = async (partnerId: string): Promise<PartnerProject[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('contact_partner_projects')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const create = async (project: Omit<PartnerProject, 'id' | 'created_at' | 'updated_at'>): Promise<PartnerProject | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('contact_partner_projects')
        .insert(project)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string, updates: Partial<Omit<PartnerProject, 'id' | 'created_at' | 'updated_at'>>): Promise<PartnerProject | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('contact_partner_projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('contact_partner_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getByPartnerId,
    create,
    update,
    deleteProject
  };
}