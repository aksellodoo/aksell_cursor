import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SearchOptions {
  query: string;
  departmentId?: string;
  includeArchived?: boolean;
  includeHidden?: boolean;
}

interface SearchResult {
  document_id: string;
  filename: string;
  folder_id: string;
  chunk_index: number;
  content: string;
  section?: string;
  distance: number;
}

export const useDocumentSearch = () => {
  const [loading, setLoading] = useState(false);

  const searchDocuments = async (options: SearchOptions): Promise<SearchResult[]> => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('search-docs', {
        body: {
          query: options.query,
          departmentId: options.departmentId,
          includeArchived: options.includeArchived || false,
          includeHidden: options.includeHidden || false
        }
      });

      if (error) throw error;

      return data.results || [];
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    searchDocuments,
    loading
  };
};