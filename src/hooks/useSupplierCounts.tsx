import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SupplierCounts {
  unified: number | null;
  potential: number | null;  
  protheus: number | null;
  missing: number | null;
}

export const useSupplierCounts = () => {
  const [counts, setCounts] = useState<SupplierCounts>({
    unified: null,
    potential: null,
    protheus: null,
    missing: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar todos os totalizadores em uma única RPC
      const { data: totalizersData, error: totalizersError } = await supabase.rpc('get_purchases_supplier_totalizers');
      
      if (totalizersError) {
        console.error('Error fetching supplier totalizers:', totalizersError);
        throw totalizersError;
      }

      // Garantir que todos os valores são números
      const totalizers = (totalizersData as any) || {};
      setCounts({
        unified: Number(totalizers.unified || 0),
        potential: Number(totalizers.potential || 0),
        protheus: Number(totalizers.protheus || 0),
        missing: Number(totalizers.missing || 0)
      });

    } catch (err) {
      console.error('Error fetching supplier counts:', err);
      setError('Erro ao carregar contadores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  return {
    counts,
    loading,
    error,
    refetch: fetchCounts
  };
};