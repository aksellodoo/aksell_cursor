import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Database, MessageSquare } from 'lucide-react';
import { AIConversationType } from '@/hooks/useAIConversations';

interface ConversationTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: AIConversationType) => void;
}

export const ConversationTypeModal: React.FC<ConversationTypeModalProps> = ({
  isOpen,
  onClose,
  onSelectType,
}) => {
  const conversationTypes = [
    {
      type: 'gestao_documentos' as AIConversationType,
      title: 'Gestão de Documentos',
      description: 'Converse sobre documentos, análises e processamento de arquivos',
      icon: FileText,
      available: false,
      color: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      type: 'protheus' as AIConversationType,
      title: 'Protheus',
      description: 'Assistente especializado no sistema Protheus para dúvidas e suporte',
      icon: Database,
      available: true,
      color: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
  ];

  const handleTypeSelect = (type: AIConversationType, available: boolean) => {
    if (!available) return;
    onSelectType(type);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Escolha o tipo de conversa
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-3 py-4">
          {conversationTypes.map((convType) => (
            <Card
              key={convType.type}
              className={`cursor-pointer transition-all ${convType.color} ${
                !convType.available ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={() => handleTypeSelect(convType.type, convType.available)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-base">
                  <convType.icon className={`h-5 w-5 ${convType.iconColor}`} />
                  {convType.title}
                  {!convType.available && (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                      Em breve
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm">
                  {convType.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};