import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type AIConversationType = 'gestao_documentos' | 'geral' | 'protheus';

export interface AIConversation {
  id: string;
  title: string;
  conversation_type: AIConversationType;
  created_by: string;
  created_at: string;
  updated_at: string;
  scope?: any;
  is_archived: boolean;
  message_count?: number;
}

export interface AIConversationMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: any;
  created_at: string;
}

export interface CreateConversationParams {
  title: string;
  type: AIConversationType;
  scope?: any;
}

export const useAIConversations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createConversation = useCallback(async (params: CreateConversationParams): Promise<string | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          title: params.title,
          conversation_type: params.type,
          scope: params.scope,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select('id')
        .single();

      if (error) throw error;

      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a conversa",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const saveMessage = useCallback(async (
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    sources?: any
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('ai_conversation_messages')
        .insert({
          conversation_id: conversationId,
          role,
          content,
          sources
        });

      if (error) throw error;

      // Update conversation updated_at
      await supabase
        .from('ai_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return true;
    } catch (error) {
      console.error('Error saving message:', error);
      return false;
    }
  }, []);

  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      // Load conversation details
      const { data: conversation, error: convError } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      // Load messages
      const { data: messages, error: messagesError } = await supabase
        .from('ai_conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      return { conversation, messages: messages || [] };
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a conversa",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const updateConversationTitle = useCallback(async (conversationId: string, title: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .update({ title })
        .eq('id', conversationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating conversation title:', error);
      return false;
    }
  }, []);

  const archiveConversation = useCallback(async (conversationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .update({ is_archived: true })
        .eq('id', conversationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error archiving conversation:', error);
      return false;
    }
  }, []);

  const deleteConversation = useCallback(async (conversationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a conversa",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  return {
    isLoading,
    createConversation,
    saveMessage,
    loadConversation,
    updateConversationTitle,
    archiveConversation,
    deleteConversation,
  };
};