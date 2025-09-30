import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { RagChatInterface } from '@/components/rag/RagChatInterface';
import { toast } from '@/components/ui/use-toast';

export default function ConversationView() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Fetch conversation details
  const { data: conversation, isLoading: conversationLoading, error: conversationError } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!conversationId,
    retry: false, // Don't retry if conversation doesn't exist
  });

  // Fetch available data for the interface only if conversation exists
  const { data: availableDocuments, isLoading: documentsLoading } = useQuery({
    queryKey: ['documents-for-rag'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('id, name, folder_id');
      
      if (error) throw error;
      
      return data || [];
    },
    enabled: !!conversation && !conversationLoading && !conversationError
  });

  const { data: availableFolders, isLoading: foldersLoading } = useQuery({
    queryKey: ['folders-for-rag'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('id, name, department_id');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!conversation && !conversationLoading && !conversationError
  });

  const { data: availableDepartments, isLoading: departmentsLoading } = useQuery({
    queryKey: ['departments-for-rag'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!conversation && !conversationLoading && !conversationError
  });

  const isLoading = conversationLoading || documentsLoading || foldersLoading || departmentsLoading;

  // Auto-redirect if conversation not found after loading
  useEffect(() => {
    if (!conversationLoading && (!conversation || conversationError) && conversationId) {
      // Check if we're still on the conversation route (not redirected already)
      const currentPath = location.pathname;
      const isStillOnConversationRoute = currentPath === `/ia/conversas/${conversationId}`;
      
      if (isStillOnConversationRoute) {
        const timer = setTimeout(() => {
          toast({
            title: "Conversa não encontrada",
            description: "A conversa foi removida ou não existe mais. Redirecionando...",
            variant: "destructive",
          });
          navigate('/ia/conversas', { replace: true });
        }, 500);

        return () => clearTimeout(timer);
      }
    }
  }, [conversationLoading, conversation, conversationError, conversationId, navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando conversa...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Conversa não encontrada</h3>
          <p className="text-muted-foreground mb-4">
            A conversa que você está procurando não existe ou foi removida.
            {!conversationLoading && <span className="block mt-2 text-sm">Redirecionando em instantes...</span>}
          </p>
          <Button onClick={() => navigate('/ia/conversas')}>
            Voltar para Conversas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/ia/conversas')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{conversation.title}</h1>
            <p className="text-muted-foreground">
              Conversa criada em {new Date(conversation.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      <RagChatInterface
        conversationId={conversationId}
        availableDocuments={availableDocuments}
        availableFolders={availableFolders}
        availableDepartments={availableDepartments}
        conversationScope={conversation.scope}
      />
    </div>
  );
}