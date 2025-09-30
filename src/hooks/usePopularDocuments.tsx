import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PopularDocument {
  id: string;
  name: string;
  type: 'document';
  path: string;
  lastAccessed?: string;
  size?: string;
  downloadCount: number;
}

export const usePopularDocuments = (limit: number = 5) => {
  const [popularDocuments, setPopularDocuments] = useState<PopularDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPopularDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get documents with their access counts from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('document_access_logs')
        .select(`
          document_id,
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
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;

      // Count accesses per document
      const documentCounts = new Map();
      data?.forEach((access: any) => {
        const doc = access.documents;
        if (doc) {
          const count = documentCounts.get(doc.id) || { document: doc, count: 0 };
          count.count += 1;
          documentCounts.set(doc.id, count);
        }
      });

      // Sort by access count and take top documents
      const popularDocs = Array.from(documentCounts.values())
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, limit)
        .map(({ document: doc, count }: any) => ({
          id: doc.id,
          name: doc.name,
          type: 'document' as const,
          path: doc.folders?.name || '',
          size: doc.file_size ? `${Math.round(doc.file_size / 1024)}KB` : undefined,
          downloadCount: count
        }));

      setPopularDocuments(popularDocs);
    } catch (error) {
      console.error('Error fetching popular documents:', error);
      setError(error instanceof Error ? error.message : 'Erro ao buscar documentos populares');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPopularDocuments();
  }, [limit]);

  return {
    popularDocuments,
    loading,
    error,
    refetch: fetchPopularDocuments
  };
};