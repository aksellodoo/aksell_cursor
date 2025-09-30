
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LeadOption {
  id: string;
  trade_name: string;
  legal_name?: string;
}

export const useLeadsSelect = () => {
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('sales_leads')
        .select('id, trade_name, legal_name')
        .order('trade_name');

      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return { leads, loading, fetchLeads };
};
