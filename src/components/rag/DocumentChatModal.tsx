import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, X, ArrowLeft } from 'lucide-react';
import { DocumentConversationsList } from './DocumentConversationsList';
import { RagChatInterface } from './RagChatInterface';
import { useDocumentConversations } from '@/hooks/useDocumentConversations';
import { useNavigate } from 'react-router-dom';

interface DocumentChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    name: string;
    folder_id: string;
  };
  folderName?: string;
  availableDocuments?: Array<{ id: string; name: string; folder_id: string }>;
}

export const DocumentChatModal: React.FC<DocumentChatModalProps> = ({
  open,
  onOpenChange,
  document,
  folderName,
  availableDocuments = []
}) => {
  const [showConversationsList, setShowConversationsList] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const { getDocumentConversations, generateConversationTitle, isLoading } = useDocumentConversations();
  const navigate = useNavigate();

  useEffect(() => {
    if (open && document.id) {
      loadConversations();
    }
  }, [open, document.id]);

  const loadConversations = async () => {
    const convs = await getDocumentConversations(document.id);
    setConversations(convs);
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setShowConversationsList(false);
  };

  const handleNewConversation = () => {
    setSelectedConversationId(null);
    setShowConversationsList(false);
  };

  const handleBackToList = () => {
    setShowConversationsList(true);
    setSelectedConversationId(null);
    loadConversations(); // Refresh list
  };

  const handleViewInConversations = () => {
    if (selectedConversationId) {
      navigate(`/ia/conversa/${selectedConversationId}`);
      onOpenChange(false);
    }
  };

  const handleChatClose = async () => {
    // Generate title if conversation exists and has default title
    if (selectedConversationId) {
      const conversation = conversations.find(c => c.id === selectedConversationId);
      if (conversation && (conversation.title.includes('Conversa') || conversation.title.includes('Nova'))) {
        try {
          const newTitle = await generateConversationTitle(selectedConversationId);
          if (newTitle) {
            // Title will be automatically updated by the edge function
            console.log('Generated new title:', newTitle);
          }
        } catch (error) {
          console.error('Failed to generate conversation title:', error);
        }
      }
    }
    
    // Check if we should go back to list or close entirely
    if (conversations.length > 0) {
      handleBackToList();
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!showConversationsList && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToList}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {showConversationsList ? 'Conversas com IA' : 'Chat com IA'}
                </DialogTitle>
                <DialogDescription>
                  Documento: {document.name}
                  {folderName && ` • Pasta: ${folderName}`}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!showConversationsList && selectedConversationId && (
                <Button variant="outline" size="sm" onClick={handleViewInConversations}>
                  Ver na Página de Conversas
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {showConversationsList ? (
            <div className="p-6">
              <DocumentConversationsList
                conversations={conversations}
                onSelectConversation={handleSelectConversation}
                onNewConversation={handleNewConversation}
                isLoading={isLoading}
              />
            </div>
          ) : (
            <div className="p-6 h-[70vh] overflow-auto">
              <RagChatInterface
                conversationId={selectedConversationId || undefined}
                availableDocuments={[document]}
                availableFolders={folderName ? [{ id: document.folder_id, name: folderName, department_id: '' }] : []}
                availableDepartments={[]}
                documentContext={{
                  document_id: document.id,
                  document_name: document.name,
                  folder_id: document.folder_id,
                  folder_name: folderName
                }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};