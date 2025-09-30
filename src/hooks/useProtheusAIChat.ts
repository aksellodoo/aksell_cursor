import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAIConversations } from './useAIConversations';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const useProtheusAIChat = (conversationId?: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const { toast } = useToast();
  const { saveMessage, loadConversation } = useAIConversations();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load existing conversation
  const loadExistingConversation = useCallback(async (convId: string) => {
    try {
      const result = await loadConversation(convId);
      if (result) {
        const formattedMessages: ChatMessage[] = result.messages.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: msg.created_at,
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a conversa",
        variant: "destructive",
      });
    }
  }, [loadConversation, toast]);

  // Send message with streaming
  const sendMessage = useCallback(async (content: string, userProfile?: any) => {
    if (!conversationId) {
      toast({
        title: "Erro",
        description: "ID da conversa não encontrado",
        variant: "destructive",
      });
      return;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsStreaming(true);

    try {
      // Save user message to database
      await saveMessage(conversationId, 'user', content);

      // Prepare messages for API (convert to format expected by AI)
      const apiMessages = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Create assistant message placeholder
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Get current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      // Make streaming request
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/protheus-ai-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': `${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: apiMessages,
            conversationId,
            userProfile
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                setIsStreaming(false);
                break;
              }

              try {
                const parsed = JSON.parse(data);
                const deltaContent = parsed.choices?.[0]?.delta?.content;
                
                if (deltaContent) {
                  accumulatedContent += deltaContent;
                  
                  // Update assistant message with accumulated content
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  ));
                }
              } catch (parseError) {
                // Skip malformed JSON
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // Save final assistant message to database
      if (accumulatedContent.trim()) {
        await saveMessage(conversationId, 'assistant', accumulatedContent);
      }

      // Only show success toast if there's actual content
      if (accumulatedContent.trim()) {
        toast({
          title: "Resposta gerada",
          description: "A IA respondeu com sucesso",
        });
      } else {
        toast({
          title: "Aviso",
          description: "A IA não conseguiu gerar uma resposta. Verifique a configuração do Protheus.",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Remove the failed assistant message
      setMessages(prev => prev.filter(msg => msg.id !== (prev[prev.length - 1]?.id)));
      
      // Handle specific error types
      let errorMessage = 'Erro ao enviar mensagem';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Requisição cancelada';
      } else if (error.message.includes('429')) {
        errorMessage = 'Limite de requisições atingido. Tente novamente em alguns instantes.';
      } else if (error.message.includes('402')) {
        errorMessage = 'Créditos esgotados. Adicione créditos no workspace Lovable.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [conversationId, messages, saveMessage, toast]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setIsLoading(false);
    }
  }, []);

  // Clear chat
  const clearChat = useCallback(() => {
    setMessages([]);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setIsLoading(false);
    }
  }, []);

  return {
    messages,
    isLoading,
    isStreaming,
    sendMessage,
    stopStreaming,
    clearChat,
    loadExistingConversation,
  };
};