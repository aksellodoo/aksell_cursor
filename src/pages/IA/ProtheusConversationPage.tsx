import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Bot, User, Loader2, Edit2, Check, X, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CustomFullscreenModal } from '@/components/ui/custom-fullscreen-modal';
import { useAIConversations } from '@/hooks/useAIConversations';
import { useProtheusAIChat } from '@/hooks/useProtheusAIChat';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

export default function ProtheusConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { updateConversationTitle } = useAIConversations();
  const { toast } = useToast();
  const { profile } = useUserProfile();
  
  // Use new Protheus AI Chat hook
  const { 
    messages, 
    isLoading, 
    isStreaming,
    sendMessage, 
    stopStreaming,
    loadExistingConversation 
  } = useProtheusAIChat(conversationId);
  
  const [isOpen, setIsOpen] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [conversationTitle, setConversationTitle] = useState('Nova Conversa Protheus');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const [isSuggestingTitle, setIsSuggestingTitle] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load conversation data on mount
  useEffect(() => {
    if (conversationId) {
      loadExistingConversation(conversationId);
      loadConversationTitle();
    }
  }, [conversationId, loadExistingConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversationTitle = async () => {
    if (!conversationId) return;
    
    try {
      const { data: conversation } = await supabase
        .from('ai_conversations')
        .select('title')
        .eq('id', conversationId)
        .single();
      
      if (conversation) {
        setConversationTitle(conversation.title);
      }
    } catch (error) {
      console.error('Error loading conversation title:', error);
    }
  };

  const suggestConversationTitle = async () => {
    if (!conversationId || messages.length < 2) return;
    
    // Only suggest if title is still generic
    if (conversationTitle !== 'Nova Conversa Protheus') return;

    setIsSuggestingTitle(true);
    try {
      const firstExchange = messages.slice(0, 2); // First user message + AI response
      const context = firstExchange.map(msg => `${msg.role}: ${msg.content}`).join('\n');

      const { data, error } = await supabase.functions.invoke('ai-suggest', {
        body: {
          sourceValues: { context },
          task: 'extract',
          instructions: 'Baseado na conversa inicial entre usuário e assistente, sugira um título conciso e descritivo para esta conversa sobre Protheus. O título deve ter no máximo 50 caracteres e capturar o tema principal da discussão.',
          outputType: 'text'
        }
      });

      if (error) throw error;

      const suggestedTitle = data?.suggestion?.trim();
      if (suggestedTitle && suggestedTitle.length <= 50) {
        const success = await updateConversationTitle(conversationId, suggestedTitle);
        if (success) {
          setConversationTitle(suggestedTitle);
        }
      }
    } catch (error) {
      console.error('Error suggesting title:', error);
    } finally {
      setIsSuggestingTitle(false);
    }
  };

  const handleTitleEdit = () => {
    setIsEditingTitle(true);
    setEditingTitleValue(conversationTitle);
  };

  const handleTitleSave = async () => {
    if (!conversationId || !editingTitleValue.trim()) return;

    const success = await updateConversationTitle(conversationId, editingTitleValue.trim());
    if (success) {
      setConversationTitle(editingTitleValue.trim());
      setIsEditingTitle(false);
      toast({
        title: "Título atualizado",
        description: "O título da conversa foi alterado com sucesso",
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o título",
        variant: "destructive",
      });
    }
  };

  const handleTitleCancel = () => {
    setIsEditingTitle(false);
    setEditingTitleValue('');
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    navigate('/ia/conversas');
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId || isLoading || isStreaming) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    
    try {
      // Send message using new AI chat hook
      await sendMessage(messageText, profile);
      
      // Suggest title after first exchange
      if (messages.length === 1) { // After this message, we'll have 2 messages
        setTimeout(() => suggestConversationTitle(), 2000);
      }
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format message content as rich markdown
  const formatMessage = (content: string) => {
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:mt-4 prose-headings:mb-2 prose-p:mb-2 prose-li:mb-0">
        <ReactMarkdown 
          components={{
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-border rounded-md">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border px-3 py-2 bg-muted font-medium text-left text-sm">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-2 text-sm">
              {children}
            </td>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            ) : (
              <pre className="bg-muted p-3 rounded-md overflow-x-auto my-3">
                <code className="text-sm font-mono">{children}</code>
              </pre>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 my-3">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 my-3">
              {children}
            </ol>
          ),
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mt-6 mb-3">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold mt-5 mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-md font-medium mt-4 mb-2">{children}</h3>
          ),
        }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <CustomFullscreenModal
      isOpen={isOpen}
      onClose={handleClose}
      className="bg-background"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-card">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
            <Bot className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editingTitleValue}
                  onChange={(e) => setEditingTitleValue(e.target.value)}
                  onKeyDown={handleTitleKeyPress}
                  onBlur={handleTitleCancel}
                  className="h-7 text-lg font-semibold"
                  maxLength={50}
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={handleTitleSave}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={handleTitleCancel}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="font-semibold text-lg cursor-pointer hover:text-primary transition-colors" onClick={handleTitleEdit}>
                  {conversationTitle}
                  {isSuggestingTitle && <Loader2 className="inline h-4 w-4 ml-2 animate-spin" />}
                </h1>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleTitleEdit}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
            )}
            <p className="text-sm text-muted-foreground">IA Protheus • Pesquisa Web + SQL + Análises</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.length === 0 && (
              <Card className="p-6 text-center">
                <Bot className="h-12 w-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">🚀 Nova IA Protheus com Superpoderes!</h3>
                <div className="text-muted-foreground space-y-2">
                  <p>Agora sua IA pode:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mt-4">
                    <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                      <div className="font-medium mb-1">🔍 Pesquisar na Web</div>
                      <div className="text-xs">Informações atuais, notícias, tecnologias</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                      <div className="font-medium mb-1">📊 Consultas SQL</div>
                      <div className="text-xs">Acesso direto aos dados do Protheus</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg">
                      <div className="font-medium mb-1">📈 Análises Automáticas</div>
                      <div className="text-xs">Insights sobre vendas, clientes, produtos</div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg">
                      <div className="font-medium mb-1">✨ Streaming em Tempo Real</div>
                      <div className="text-xs">Respostas aparecem conforme são geradas</div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-emerald-100 dark:bg-emerald-900'
                }`}>
                  {message.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <Card className={`flex-1 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card'
                }`}>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium opacity-70">
                        {message.role === 'user' ? 'Você' : 'IA Protheus'}
                      </span>
                      <span className="text-xs opacity-50">
                        {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="text-sm">
                      {message.role === 'user' ? (
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      ) : (
                        formatMessage(message.content)
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            ))}
            
            {(isLoading || isStreaming) && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <Card className="flex-1 bg-card">
                  <div className="p-4">
                    <div className="text-xs font-medium opacity-70 mb-2">IA Protheus</div>
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">
                        {isStreaming ? 'Gerando resposta...' : 'Processando sua solicitação...'}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t bg-card p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Digite sua pergunta sobre Protheus... (Shift+Enter para nova linha)"
                className="flex-1 min-h-[80px] resize-none"
                disabled={isLoading || isStreaming}
              />
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isLoading || isStreaming}
                  size="icon"
                  className="h-[38px] w-[38px]"
                >
                  <Send className="h-4 w-4" />
                </Button>
                {isStreaming && (
                  <Button
                    onClick={stopStreaming}
                    variant="outline"
                    size="icon"
                    className="h-[38px] w-[38px]"
                    title="Parar geração"
                  >
                    <Square className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            
            {messages.length === 0 && (
              <div className="mt-4 text-sm text-muted-foreground">
                <p className="font-medium mb-2">💡 Exemplos do que você pode perguntar:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div>• "Liste os 10 maiores clientes"</div>
                  <div>• "Qual o crescimento do setor automotivo em 2024?"</div>
                  <div>• "Análise de vendas por vendedor"</div>
                  <div>• "Notícias sobre ERP no Brasil"</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CustomFullscreenModal>
  );
}