import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseCurrentDocumentVersionProps {
  fileName?: string;
  folderId?: string;
  departmentId?: string;
}

export const useCurrentDocumentVersion = ({
  fileName,
  folderId,
  departmentId
}: UseCurrentDocumentVersionProps) => {
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileName || !folderId || !departmentId) {
      setCurrentVersion(null);
      return;
    }

    const fetchCurrentVersion = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('documents')
          .select('version_number')
          .eq('name', fileName)
          .eq('folder_id', folderId)
          .eq('department_id', departmentId)
          .order('version_number', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          setCurrentVersion(data[0].version_number);
        } else {
          setCurrentVersion(null);
        }
      } catch (err) {
        console.error('Error fetching current document version:', err);
        setError(err instanceof Error ? err.message : 'Erro ao buscar versão atual');
        setCurrentVersion(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentVersion();
  }, [fileName, folderId, departmentId]);

  const getNextVersion = () => {
    return currentVersion ? currentVersion + 1 : 1;
  };

  return {
    currentVersion,
    nextVersion: getNextVersion(),
    loading,
    error
  };
};