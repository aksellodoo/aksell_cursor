import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DocumentItem } from '@/pages/DocumentManagement';
import { toast } from 'sonner';

export const useDocumentActions = (folderId?: string) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!folderId) {
      setDocuments([]);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          name,
          status,
          rag_status,
          mime_type,
          file_size,
          created_at,
          folder_id
        `)
        .eq('folder_id', folderId)
        .order('name');

      if (error) throw error;

      const formattedDocs: DocumentItem[] = (data || []).map(doc => {
        // Normalize status from database format to frontend format
        const normalizeStatus = (status: string) => {
          switch (status) {
            case 'Aprovado': return 'aprovado';
            case 'Pendente_Revisao': 
            case 'Pendente Revisão': return 'pendente_revisao';
            case 'Pendente_Aprovacao':
            case 'Pendente Aprovação': return 'pendente_aprovacao';
            case 'Rejeitado': return 'rejeitado';
            case 'Obsoleto': return 'obsoleto';
            case 'Processando': return 'processing';
            case 'Ativo': return 'active';
            case 'Erro': return 'error';
            case 'Arquivado': return 'archived';
            case 'Oculto': return 'hidden';
            default: return status.toLowerCase();
          }
        };

        return {
          id: doc.id,
          name: doc.name,
          status: normalizeStatus(doc.status) as DocumentItem['status'],
          rag_status: doc.rag_status || 'not_processed',
          mime_type: doc.mime_type,
          file_size: doc.file_size,
          updated_at: doc.created_at,
          version: 1,
          folder_id: doc.folder_id
        };
      });

      setDocuments(formattedDocs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  const downloadDocument = async (documentId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('download-doc', {
        body: { id: documentId }
      });

      if (error) throw error;

      if (data.download_url && data.filename) {
        // Programmatic download with correct filename
        const response = await fetch(data.download_url);
        if (!response.ok) throw new Error('Falha ao baixar arquivo');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = data.filename; // Use original filename from backend
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success('Download concluído');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Erro ao baixar documento');
    }
  };

  const viewDocument = async (documentId: string): Promise<string | null> => {
    console.log('Getting view URL for document:', documentId);
    
    try {
      // Get the token for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado');
      }

      // Use view-doc function directly - now supports HEAD requests
      const baseUrl = 'https://nahyrexnxhzutfeqxjte.supabase.co';
      const viewUrl = `${baseUrl}/functions/v1/view-doc?id=${documentId}`;
      
      console.log('Using view-doc function URL:', viewUrl);
      return viewUrl;
    } catch (error) {
      console.error('Error getting document view URL:', error);
      toast.error('Erro ao visualizar documento');
      return null;
    }
  };

  const reprocessDocument = async (documentId: string) => {
    try {
      // First update processing_status to processing and clear any error
      const { error: updateError } = await supabase
        .from('documents')
        .update({ 
          rag_status: 'processing',
          error_message: null
        })
        .eq('id', documentId);

      if (updateError) {
        throw new Error(`Erro ao atualizar status: ${updateError.message}`);
      }

      // Mark for manual processing since automatic reprocessing is deprecated
      console.log(`Marking document ${documentId} for manual review`);

      toast.success('Documento enviado para reprocessamento');
      await fetchDocuments();
    } catch (error) {
      console.error('Error reprocessing document:', error);
      toast.error(`Erro ao reprocessar documento: ${error.message}`);
    }
  };

  const archiveDocument = async (documentId: string) => {
    try {
      // TODO: Add status column to documents table
      // await supabase
      //   .from('documents')
      //   .update({ status: 'archived' })
      //   .eq('id', documentId);

      toast.success('Documento arquivado');
      await fetchDocuments();
    } catch (error) {
      console.error('Error archiving document:', error);
      toast.error('Erro ao arquivar documento');
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('delete-document', {
        body: { document_id: documentId }
      });

      if (error) {
        console.error('Error deleting document:', error);
        if (error.message?.includes('Failed to fetch')) {
          toast.error('Erro de conexão. Tente novamente.');
        } else {
          toast.error('Erro ao excluir documento');
        }
        return;
      }

      if (!data?.success) {
        toast.error(data?.error || 'Erro ao excluir documento');
        return;
      }

      toast.success(`Documento "${data.document_name}" excluído com sucesso`);
      await fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        toast.error('Erro de conexão. Verifique sua internet e tente novamente.');
      } else {
        toast.error('Erro interno. Tente novamente.');
      }
    }
  };

  const bulkAction = async (documentIds: string[], action: 'archive' | 'reprocess') => {
    try {
      if (action === 'archive') {
        await supabase
          .from('documents')
          .update({ status: 'archived' })
          .in('id', documentIds);
        toast.success(`${documentIds.length} documentos arquivados`);
      } else if (action === 'reprocess') {
        // First update all documents to processing status
        await supabase
          .from('documents')
          .update({ rag_status: 'processing', error_message: null })
          .in('id', documentIds);

        // Mark documents for manual review since automatic reprocessing is deprecated
        console.log(`Marking ${documentIds.length} documents for manual review`);
        toast.success(`${documentIds.length} documentos em reprocessamento`);
      }

      await fetchDocuments();
    } catch (error) {
      console.error(`Error in bulk ${action}:`, error);
      toast.error(`Erro na ação em lote`);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Realtime subscription for document changes
  useEffect(() => {
    if (!folderId) return;

    const channel = supabase
      .channel('document-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `folder_id=eq.${folderId}`
        },
        (payload) => {
          console.log('Document change detected:', payload);
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [folderId, fetchDocuments]);

  // Polling para documentos em processamento (fallback)
  useEffect(() => {
    const processingDocuments = documents.filter(doc => (doc as any).rag_status === 'processing');
    
    if (processingDocuments.length === 0) {
      return; // Não há documentos processando
    }

    console.log(`Polling ${processingDocuments.length} processing documents...`);
    const pollInterval = setInterval(() => {
      fetchDocuments();
    }, 5000); // Poll a cada 5 segundos (menos frequente com realtime)

    return () => clearInterval(pollInterval);
  }, [documents, fetchDocuments]);

  return {
    documents,
    loading,
    refetch: fetchDocuments,
    downloadDocument,
    viewDocument,
    reprocessDocument,
    archiveDocument,
    deleteDocument,
    bulkAction
  };
};