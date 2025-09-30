import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDocumentAccess = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const logAccess = async (
    documentId: string,
    folderId: string,
    accessType: 'view' | 'download'
  ) => {
    try {
      setLoading(true);

      // Get user agent and basic client info
      const userAgent = navigator.userAgent;
      
      const { error } = await supabase.rpc('log_document_access', {
        p_document_id: documentId,
        p_folder_id: folderId,
        p_access_type: accessType,
        p_user_agent: userAgent
      });

      if (error) throw error;

    } catch (error) {
      console.error('Error logging document access:', error);
      // Don't show error toast for logging failures to avoid user interruption
    } finally {
      setLoading(false);
    }
  };

  return {
    logAccess,
    loading
  };
};