import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAIConversations, type AIConversationType } from './useAIConversations';

export interface ChatScope {
  type: 'document' | 'folder' | 'department' | 'global';
  id?: string;
  name?: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  sources?: DocumentSource[];
  modelUsed?: string;
}

export interface DocumentSource {
  document_id: string;
  filename: string;
  folder_id: string;
  chunk_index: number;
  snippet: string;
  distance: number;
  section?: string;
  page_number?: number;
  slide_number?: number;
  extraction_source?: string;
  has_image_analysis?: boolean;
  semantic_description?: string | null;
  extracted_objects?: string[];
}

export interface AskDocsResponse {
  answer: string;
  sources: DocumentSource[];
  modelUsed?: string;
}

export const useRagChat = (conversationId?: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId || null);
  const { createConversation, saveMessage, loadConversation } = useAIConversations();

  const generateMessageId = () => Math.random().toString(36).substring(2);

  const askQuestion = async (
    query: string, 
    scope: ChatScope
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    // Add user message
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      type: 'user',
      content: query,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Prepare history from last 6 messages for context
      const history = messages.slice(-6).map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content.length > 1000 ? msg.content.substring(0, 1000) + '...' : msg.content
      }));

      const requestBody: any = {
        query,
        scope: scope.type,
        history,
      };

      // Add scope-specific parameters and adjust topK based on scope
      if (scope.type === 'document' && scope.id) {
        requestBody.documentId = scope.id;
        requestBody.topK = 12; // Smaller topK for single document
      } else if (scope.type === 'folder' && scope.id) {
        requestBody.folderId = scope.id;
        requestBody.topK = 24; // Larger topK to get chunks from multiple documents
      } else if (scope.type === 'department' && scope.id) {
        requestBody.departmentId = scope.id;
        requestBody.topK = 32; // Even larger topK for department scope
      } else {
        requestBody.topK = 16; // Default for global scope
      }

      const { data, error: invokeError } = await supabase.functions.invoke('ask-docs', {
        body: requestBody,
      });

      if (invokeError) {
        console.error('Error calling ask-docs:', invokeError);
        throw new Error('Falha ao processar pergunta');
      }

      const response: AskDocsResponse = data;

      // Add AI response
      const aiMessage: ChatMessage = {
        id: generateMessageId(),
        type: 'ai',
        content: response.answer,
        timestamp: new Date(),
        sources: response.sources,
        modelUsed: response.modelUsed,
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      
      // Add error message
      const errorAiMessage: ChatMessage = {
        id: generateMessageId(),
        type: 'ai',
        content: `Desculpe, ocorreu um erro: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorAiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return {
    messages,
    isLoading,
    error,
    askQuestion,
    clearChat,
  };
};