import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AIConversation } from './useAIConversations';

export const useDocumentConversations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getDocumentConversations = useCallback(async (documentId: string): Promise<AIConversation[]> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select(`
          id,
          title,
          conversation_type,
          created_by,
          created_at,
          updated_at,
          scope,
          is_archived,
          ai_conversation_messages(count)
        `)
        .eq('conversation_type', 'gestao_documentos')
        .eq('is_archived', false)
        .contains('scope', { documentContext: { document_id: documentId } })
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data.map(conv => ({
        ...conv,
        message_count: conv.ai_conversation_messages?.[0]?.count || 0
      })) || [];
    } catch (error) {
      console.error('Error fetching document conversations:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as conversas do documento",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const generateConversationTitle = useCallback(async (conversationId: string): Promise<string | null> => {
    try {
      const { data: messages, error } = await supabase
        .from('ai_conversation_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10); // Only use first 10 messages for context

      if (error) throw error;

      if (!messages || messages.length === 0) {
        return null;
      }

      const { data, error: functionError } = await supabase.functions.invoke('generate-conversation-title', {
        body: { messages }
      });

      if (functionError) throw functionError;

      return data?.title || null;
    } catch (error) {
      console.error('Error generating conversation title:', error);
      return null;
    }
  }, []);

  return {
    isLoading,
    getDocumentConversations,
    generateConversationTitle,
  };
};