import React from 'react';
import { Clock, MessageSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AIConversation } from '@/hooks/useAIConversations';

interface DocumentConversationsListProps {
  conversations: AIConversation[];
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  isLoading?: boolean;
}

export const DocumentConversationsList: React.FC<DocumentConversationsListProps> = ({
  conversations,
  onSelectConversation,
  onNewConversation,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversas Anteriores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversas Anteriores
            <Badge variant="secondary">{conversations.length}</Badge>
          </CardTitle>
          <Button onClick={onNewConversation} size="sm">
            Nova Conversa
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {conversations.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma conversa anterior com este documento</p>
            <Button onClick={onNewConversation} className="mt-2" size="sm">
              Iniciar Primeira Conversa
            </Button>
          </div>
        ) : (
          conversations.map((conversation) => (
            <Card 
              key={conversation.id} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onSelectConversation(conversation.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate mb-1">
                      {conversation.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(conversation.updated_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                      <span>•</span>
                      <MessageSquare className="h-3 w-3" />
                      <span>{conversation.message_count || 0} mensagens</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
};