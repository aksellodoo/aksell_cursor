import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DocumentVersion {
  id: string;
  version_number: number;
  created_at: string;
  created_by: string;
  file_size: number;
  chunk_count: number;
  rag_summary?: string;
}

interface VersionComparison {
  success: boolean;
  comparison: any[];
  analysis: string;
  stats: {
    total_chunks: number;
    added: number;
    modified: number;
    removed: number;
    unchanged: number;
  };
}

export const useDocumentVersions = () => {
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);

  const getVersions = async (documentId: string): Promise<DocumentVersion[]> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('document_versions')
        .select(`
          id,
          version_number,
          created_at,
          created_by,
          file_size,
          chunk_count,
          rag_summary
        `)
        .eq('document_id', documentId)
        .order('version_number', { ascending: false });

      if (error) throw error;

      setVersions(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching document versions:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const compareVersions = async (
    documentId: string, 
    previousVersionId?: string
  ): Promise<VersionComparison> => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('compare-document-versions', {
        body: {
          documentId,
          previousVersionId
        }
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error comparing versions:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getVersionChunks = async (versionId: string) => {
    try {
      const { data, error } = await supabase
        .from('document_version_chunks')
        .select('*')
        .eq('version_id', versionId)
        .order('chunk_index');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching version chunks:', error);
      throw error;
    }
  };

  return {
    loading,
    versions,
    getVersions,
    compareVersions,
    getVersionChunks
  };
};