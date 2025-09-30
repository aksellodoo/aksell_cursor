import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, MessageSquare, Calendar, User, ArrowRight, Trash2, FileText, Folder } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAIConversations } from '@/hooks/useAIConversations';
import { useToast } from '@/hooks/use-toast';
import { ConversationTypeModal } from '@/components/ia/ConversationTypeModal';

interface AIConversation {
  id: string;
  title: string;
  conversation_type: 'gestao_documentos' | 'geral' | 'protheus';
  created_by: string;
  created_at: string;
  updated_at: string;
  scope: any;
  is_archived: boolean;
  profiles?: {
    display_name?: string;
    role?: string;
  } | null;
  message_count: number;
  last_message_at: string;
  document_name?: string;
  folder_name?: string;
}

export default function ConversasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showTypeModal, setShowTypeModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();
  const { deleteConversation, createConversation } = useAIConversations();
  const { toast } = useToast();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['ai-conversations', searchTerm, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from('ai_conversations')
        .select(`
          *
        `)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });

      if (typeFilter !== 'all') {
        query = query.eq('conversation_type', typeFilter as 'gestao_documentos' | 'geral' | 'protheus');
      }

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data?.map(conv => {
        // Extract document context from scope if available
        const documentContext = (conv.scope as any)?.documentContext;
        return {
          ...conv,
          message_count: 0, // Will fetch separately if needed
          last_message_at: conv.updated_at,
          profiles: null,
          document_name: documentContext?.document_name,
          folder_name: documentContext?.folder_name
        };
      }) || [];
    }
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'gestao_documentos':
        return 'Gestão de Documentos';
      case 'geral':
        return 'Geral';
      case 'protheus':
        return 'Protheus';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'gestao_documentos':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'geral':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'protheus':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleConversationClick = (conversation: AIConversation) => {
    if (conversation.conversation_type === 'protheus') {
      navigate(`/ia/conversa-protheus/${conversation.id}`);
    } else {
      navigate(`/ia/conversa/${conversation.id}`);
    }
  };

  const handleNewConversation = () => {
    setShowTypeModal(true);
  };

  const handleTypeSelect = async (type: 'gestao_documentos' | 'geral' | 'protheus') => {
    setShowTypeModal(false);
    
    if (type === 'gestao_documentos') {
      toast({
        title: "Em desenvolvimento",
        description: "A funcionalidade de Gestão de Documentos estará disponível em breve.",
      });
      return;
    }

    try {
      const title = type === 'protheus' ? 'Nova Conversa Protheus' : 'Nova Conversa';
      const conversationId = await createConversation({
        title,
        type,
        scope: type === 'protheus' ? { system_type: 'protheus' } : undefined,
      });

      if (conversationId) {
        if (type === 'protheus') {
          navigate(`/ia/conversa-protheus/${conversationId}`);
        } else {
          navigate(`/ia/conversa/${conversationId}`);
        }
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a conversa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConversation = async (conversationId: string, conversationTitle: string) => {
    try {
      // Clear cache before deletion to prevent loading issues
      await queryClient.removeQueries({ queryKey: ['conversation', conversationId] });
      await queryClient.removeQueries({ queryKey: ['ai-conversation-messages', conversationId] });

      const success = await deleteConversation(conversationId);
      if (success) {
        // Force refetch to ensure UI updates immediately
        await queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
        
        toast({
          title: "Conversa excluída",
          description: `A conversa "${conversationTitle}" foi excluída com sucesso.`,
        });
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a conversa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const isAdminOrDirector = profile?.role === 'admin' || profile?.role === 'director';

  const filteredConversations = conversations || [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando conversas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Conversas com IA</h1>
            <p className="text-muted-foreground">
              Gerencie e acesse todas as suas conversas com a inteligência artificial
            </p>
          </div>
          <Button 
            onClick={handleNewConversation}
            className="w-fit"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Nova Conversa
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={typeFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setTypeFilter('all')}
            size="sm"
          >
            Todas
          </Button>
          <Button
            variant={typeFilter === 'gestao_documentos' ? 'default' : 'outline'}
            onClick={() => setTypeFilter('gestao_documentos')}
            size="sm"
          >
            Gestão de Documentos
          </Button>
          <Button
            variant={typeFilter === 'geral' ? 'default' : 'outline'}
            onClick={() => setTypeFilter('geral')}
            size="sm"
          >
            Geral
          </Button>
          <Button
            variant={typeFilter === 'protheus' ? 'default' : 'outline'}
            onClick={() => setTypeFilter('protheus')}
            size="sm"
          >
            Protheus
          </Button>
        </div>
      </div>

      {/* Lista de Conversas */}
      {filteredConversations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma conversa encontrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || typeFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca' 
                : 'Comece uma nova conversa com a IA'
              }
            </p>
            <Button onClick={handleNewConversation}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Iniciar Conversa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredConversations.map((conversation) => (
            <div key={conversation.id} className="flex items-center gap-4">
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow flex-1"
                onClick={() => handleConversationClick(conversation)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{conversation.title}</CardTitle>
                        <Badge className={getTypeColor(conversation.conversation_type)}>
                          {getTypeLabel(conversation.conversation_type)}
                        </Badge>
                      </div>
                      {conversation.conversation_type === 'gestao_documentos' && (conversation.document_name || conversation.folder_name) && (
                        <div className="text-sm text-muted-foreground mb-2">
                          {conversation.document_name && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {conversation.document_name}
                            </span>
                          )}
                          {conversation.folder_name && (
                            <span className="flex items-center gap-1 mt-1">
                              <Folder className="h-3 w-3" />
                              {conversation.folder_name}
                            </span>
                          )}
                        </div>
                      )}
                      <CardDescription className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {conversation.profiles?.display_name || 'Usuário'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {conversation.message_count} mensagens
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(conversation.last_message_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
              
              {/* Botão deletar fora do card */}
              {isAdminOrDirector && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Conversa</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir a conversa "{conversation.title}"? 
                        Esta ação não pode ser desfeita e todas as mensagens serão permanentemente removidas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteConversation(conversation.id, conversation.title)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}
        </div>
      )}

      <ConversationTypeModal
        isOpen={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        onSelectType={handleTypeSelect}
      />
    </div>
  );
}