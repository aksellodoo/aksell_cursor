import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MissingSupplier {
  source: 'protheus' | 'potential';
  potential_id?: string;
  protheus_filial?: string;
  protheus_cod?: string;
  protheus_loja?: string;
  trade_name?: string;
  legal_name?: string;
  cnpj?: string;
}

export const useMissingSuppliers = () => {
  const [missingSuppliers, setMissingSuppliers] = useState<MissingSupplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMissingSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.rpc('list_missing_unified_suppliers');
      
      if (fetchError) {
        console.error('Error fetching missing suppliers:', fetchError);
        throw fetchError;
      }

      setMissingSuppliers((data || []) as MissingSupplier[]);
    } catch (err) {
      console.error('Error fetching missing suppliers:', err);
      setError('Erro ao carregar fornecedores faltantes');
      setMissingSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissingSuppliers();
  }, []);

  return {
    missingSuppliers,
    loading,
    error,
    refetch: fetchMissingSuppliers
  };
};