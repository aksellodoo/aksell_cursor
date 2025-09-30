
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Department {
  id: string;
  name: string;
  description: string | null;
  color: string;
  integrates_org_chart: boolean;
  document_root_enabled: boolean;
  document_root_folder_id: string | null;
  created_at: string;
  updated_at: string;
}

interface UseDepartmentsOptions {
  includeTestDepartments?: boolean;
}

export const useDepartments = (options: UseDepartmentsOptions = {}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const { includeTestDepartments = false } = options;

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      
      let filteredData = data || [];
      
      // Filter out test departments only if not explicitly included
      if (!includeTestDepartments) {
        filteredData = filteredData.filter(dept => {
          const name = dept.name.toLowerCase();
          return !name.includes('[test]') && 
                 !name.includes('test') && 
                 !name.includes('[teste]') &&
                 !name.includes('teste') &&
                 !dept.name.includes('[TEST]') && 
                 !dept.name.includes('TEST');
        });
      }
      
      setDepartments(filteredData);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return {
    departments,
    loading,
    refetch: fetchDepartments,
  };
};
