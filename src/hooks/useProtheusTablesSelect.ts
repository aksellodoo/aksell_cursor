
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProtheusTableOption {
  id: string;
  table_name: string;
  description?: string;
}

export const useProtheusTablesSelect = () => {
  const [tables, setTables] = useState<ProtheusTableOption[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTables = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('protheus_tables')
        .select('id, table_name, description')
        .order('table_name');

      if (error) throw error;
      setTables(data || []);
    } catch (err) {
      console.error('Error fetching protheus tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  return { tables, loading, fetchTables };
};
