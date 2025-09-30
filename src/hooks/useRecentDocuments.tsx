import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RecentDocument {
  id: string;
  name: string;
  type: 'document';
  path: string;
  lastAccessed: string;
  size?: string;
  downloadCount?: number;
}

export const useRecentDocuments = (limit: number = 5) => {
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('document_access_logs')
        .select(`
          document_id,
          created_at,
          documents!fk_document_access_logs_document_id (
            id,
            name,
            file_size,
            folder_id,
            folders!documents_folder_id_fkey (
              name
            )
          )
        `)
        .eq('access_type', 'view')
        .order('created_at', { ascending: false })
        .limit(limit * 2); // Get more to deduplicate

      if (error) throw error;

      // Group by document_id and get the most recent access for each
      const documentMap = new Map();
      data?.forEach((access: any) => {
        const doc = access.documents;
        if (doc && (!documentMap.has(doc.id) || new Date(access.created_at) > new Date(documentMap.get(doc.id).lastAccessed))) {
          documentMap.set(doc.id, {
            id: doc.id,
            name: doc.name,
            type: 'document' as const,
            path: doc.folders?.name || '',
            lastAccessed: access.created_at,
            size: doc.file_size ? `${Math.round(doc.file_size / 1024)}KB` : undefined
          });
        }
      });

      // Convert to array and limit results
      const recentDocs = Array.from(documentMap.values())
        .sort((a: any, b: any) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
        .slice(0, limit);

      setRecentDocuments(recentDocs);
    } catch (error) {
      console.error('Error fetching recent documents:', error);
      setError(error instanceof Error ? error.message : 'Erro ao buscar documentos recentes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentDocuments();
  }, [limit]);

  return {
    recentDocuments,
    loading,
    error,
    refetch: fetchRecentDocuments
  };
};