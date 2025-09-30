import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAIConversations, type AIConversationType } from './useAIConversations';
import { useToast } from '@/hooks/use-toast';

export interface DocumentContext {
  document_id?: string;
  document_name?: string;
  folder_id?: string;
  folder_name?: string;
}

export interface ChatScope {
  type: 'document' | 'folder' | 'department' | 'global';
  id?: string;
  name?: string;
  documentContext?: DocumentContext;
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

export const useRagChatWithPersistence = (conversationId?: string, documentContext?: DocumentContext) => {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const { createConversation, saveMessage, loadConversation } = useAIConversations();
  const { toast } = useToast();

  const generateMessageId = () => Math.random().toString(36).substring(2);

  const generateConversationTitle = useCallback((query: string): string => {
    // Generate a title from the first question, max 50 chars
    const cleanQuery = query.trim().replace(/\s+/g, ' ');
    return cleanQuery.length > 50 
      ? cleanQuery.substring(0, 47) + '...'
      : cleanQuery;
  }, []);

  // Load existing conversation if conversationId is provided
  useEffect(() => {
    console.log('useEffect triggered:', { conversationId, currentConversationId });
    if (conversationId && conversationId !== currentConversationId) {
      console.log('Loading conversation:', conversationId);
      loadExistingConversation(conversationId);
    }
  }, [conversationId]);

  const loadExistingConversation = async (convId: string) => {
    try {
      console.log('Loading conversation ID:', convId);
      const result = await loadConversation(convId);
      console.log('Loaded conversation result:', result);
      
      if (result && result.conversation) {
        const { conversation, messages: loadedMessages } = result;
        console.log('Loaded messages count:', loadedMessages.length);
        
        setCurrentConversationId(conversation.id);
        
        // Convert loaded messages to ChatMessage format
        const chatMessages: ChatMessage[] = loadedMessages.map(msg => ({
          id: msg.id,
          type: msg.role as 'user' | 'ai',
          content: msg.content,
          timestamp: new Date(msg.created_at),
          sources: (msg.sources as any as DocumentSource[]) || [],
        }));
        
        console.log('Converted messages:', chatMessages);
        setMessages(chatMessages);
      } else {
        console.log('No conversation found for ID:', convId);
        setMessages([]);
        setCurrentConversationId(null);
        // Don't show error for missing conversation - let the parent component handle it
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      setMessages([]);
      setCurrentConversationId(null);
      // Only show toast for actual loading errors, not missing conversations
      if (error instanceof Error && !error.message.includes('not found')) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar a conversa",
          variant: "destructive",
        });
      }
    }
  };

  const askQuestion = async (query: string, scope: ChatScope): Promise<void> => {
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
      // Create conversation if this is the first message and no conversation exists
      let conversationId = currentConversationId;
      if (!conversationId && messages.length === 0) {
        const title = generateConversationTitle(query);
        conversationId = await createConversation({
          title,
          type: 'gestao_documentos', // Default type for RAG conversations
          scope: {
            type: scope.type,
            id: scope.id,
            name: scope.name,
            documentContext: documentContext || {
              document_id: scope.type === 'document' ? scope.id : undefined,
              document_name: scope.type === 'document' ? scope.name : undefined,
              folder_id: scope.type === 'folder' ? scope.id : undefined,
              folder_name: scope.type === 'folder' ? scope.name : undefined,
            }
          }
        });
        
        if (conversationId) {
          setCurrentConversationId(conversationId);
        }
      }

      // Save user message to database
      if (conversationId) {
        await saveMessage(conversationId, 'user', query);
      }

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

      // Save AI response to database
      if (conversationId) {
        await saveMessage(conversationId, 'assistant', response.answer, response.sources);
      }

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
    setCurrentConversationId(null);
  };

  return {
    messages,
    isLoading,
    error,
    askQuestion,
    clearChat,
    conversationId: currentConversationId,
  };
};