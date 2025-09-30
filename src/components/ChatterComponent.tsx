import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MentionInput } from '@/components/MentionInput';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Search, Filter, Pin, MoreVertical, Reply, Clock, User, FileText } from 'lucide-react';
import { EmailComposer } from '@/components/EmailComposer';
import EmailViewerModal from '@/components/EmailViewerModal';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useChatter, ChatterTimelineItem } from '@/hooks/useChatter';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatterComponentProps {
  recordType: string;
  recordId: string;
  recordName?: string;
  className?: string;
  density?: 'compact' | 'comfortable';
}

export const ChatterComponent: React.FC<ChatterComponentProps> = ({
  recordType,
  recordId,
  recordName,
  className = "",
  density = 'compact'
}) => {
  const { user } = useAuth();
  const {
    timeline,
    loading,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    sendMessage,
    togglePin,
    deleteMessage,
    refreshData
  } = useChatter(recordType, recordId);
  
  const isCompact = density === 'compact';

  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'internal' | 'external'>('internal');
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [viewEmailMessageId, setViewEmailMessageId] = useState<string | null>(null);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    console.log('Sending message with mentions:', mentionedUsers);

    try {
      await sendMessage(
        newMessage, 
        messageType,
        replyingTo || undefined,
        mentionedUsers.length > 0 ? mentionedUsers : undefined
      );
      
      setNewMessage('');
      setReplyingTo(null);
      setMentionedUsers([]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Renderizar texto com menções destacadas
  const renderMessageWithMentions = (message: string) => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(message)) !== null) {
      // Adicionar texto antes da menção
      if (match.index > lastIndex) {
        parts.push(message.slice(lastIndex, match.index));
      }
      
      // Adicionar menção como badge
      parts.push(
        <Badge key={match.index} variant="secondary" className="mx-1">
          @{match[1]}
        </Badge>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Adicionar texto restante
    if (lastIndex < message.length) {
      parts.push(message.slice(lastIndex));
    }
    
    return parts.length > 0 ? parts : message;
  };

  const renderTimelineItem = (item: ChatterTimelineItem) => {
    const isOwnMessage = item.type === 'message' && item.author?.id === user?.id;
    
    return (
      <div key={item.id} className="flex gap-3 mb-6">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="text-xs bg-muted">
            {item.author ? getInitials(item.author.name) : <User className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {item.author?.name || 'Sistema'}
            </span>
            <Badge variant={item.type === 'message' ? 'default' : 'secondary'} className="text-xs">
              {item.type === 'message' ? 'Mensagem' : 'Mudança'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(item.timestamp), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
          </div>

          {item.type === 'message' ? (
            <Card className="border-l-4 border-l-primary/20">
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {item.content.message_type === 'external' && (
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium text-blue-700">
                            Email: {item.content.subject}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setViewEmailMessageId(item.id)}
                        >
                          Ver email
                        </Button>
                      </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap">
                      {item.content.message_type === 'external'
                        ? (
                          <span className="text-muted-foreground">
                            {item.content.message}
                          </span>
                        )
                        : renderMessageWithMentions(item.content.message)
                      }
                    </div>
                    
                    {item.content.is_pinned && (
                      <Badge variant="outline" className="mt-2">
                        <Pin className="h-3 w-3 mr-1" />
                        Fixada
                      </Badge>
                    )}
                  </div>

                  {isOwnMessage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setReplyingTo(item.id)}>
                          <Reply className="h-4 w-4 mr-2" />
                          Responder
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePin(item.id, item.content.is_pinned)}>
                          <Pin className="h-4 w-4 mr-2" />
                          {item.content.is_pinned ? 'Desafixar' : 'Fixar'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteMessage(item.id)}
                          className="text-destructive"
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-l-4 border-l-amber-200 bg-amber-50/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="font-medium">Campo alterado:</span>
                  <Badge variant="outline">{item.content.field_name}</Badge>
                </div>
                <div className="mt-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">De:</span>
                      <span className="ml-2 font-mono text-xs bg-red-100 px-2 py-1 rounded">
                        {item.content.old_value || '(vazio)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Para:</span>
                      <span className="ml-2 font-mono text-xs bg-green-100 px-2 py-1 rounded">
                        {item.content.new_value || '(vazio)'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-muted-foreground">
            Carregando chatter...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="py-2 px-3">
        {/* Search, Filter, and Type Selector */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar mensagens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tudo</SelectItem>
                <SelectItem value="messages">Mensagens</SelectItem>
                <SelectItem value="audit">Mudanças</SelectItem>
              </SelectContent>
            </Select>

            <Select value={messageType} onValueChange={(value: any) => {
                if (value === 'external') {
                  setShowEmailComposer(true);
                  setMessageType('internal');
                } else {
                  setMessageType('internal');
                }
              }}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Nota</SelectItem>
                <SelectItem value="external">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Message Composer */}
        <div className="px-3 py-2 border-b">
          {replyingTo && (
            <div className="mb-3 p-2 bg-muted rounded-md text-sm">
              <span className="text-muted-foreground">Respondendo a mensagem...</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setReplyingTo(null)}
                className="ml-2 h-6 px-2"
              >
                Cancelar
              </Button>
            </div>
          )}
          
          <div className="space-y-2">
            
            <MentionInput
              placeholder="Digite sua mensagem... (@mencionar usuário)"
              value={newMessage}
              onChange={setNewMessage}
              onMentionsChange={setMentionedUsers}
              rows={3}
            />
            
            <div className="flex justify-end">
              <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                Enviar {messageType === 'external' ? 'Email' : 'Nota'}
              </Button>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <ScrollArea className="h-96 p-4">
          {timeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mb-2" />
              <p>Nenhuma atividade encontrada</p>
              <p className="text-sm">Seja o primeiro a enviar uma mensagem!</p>
            </div>
          ) : (
            <div className="space-y-0">
              {timeline.map(renderTimelineItem)}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Email Composer Fullscreen */}
      {showEmailComposer && (
        <EmailComposer
          open={showEmailComposer}
          onClose={() => setShowEmailComposer(false)}
          recordType={recordType}
          recordId={recordId}
          onSent={() => refreshData()}
        />
      )}

      {/* Email Viewer Modal */}
      {viewEmailMessageId && (
        <EmailViewerModal
          open={!!viewEmailMessageId}
          onClose={() => setViewEmailMessageId(null)}
          messageId={viewEmailMessageId}
        />
      )}
    </Card>
  );
};
