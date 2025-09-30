import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileText, Download, FolderOpen, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useRagChatWithPersistence, ChatScope, ChatMessage } from '@/hooks/useRagChatWithPersistence';
import { useToast } from '@/hooks/use-toast';
import { DocumentSelector } from './DocumentSelector';
import { supabase } from '@/integrations/supabase/client';

interface RagChatPanelProps {
  initialScope?: ChatScope;
  selectedDocument?: { id: string; name: string; folder_id: string };
  selectedFolder?: { id: string; name: string };
  selectedDepartment?: { id: string; name: string };
  availableDocuments?: Array<{ id: string; name: string; folder_id: string }>;
}

export const RagChatPanel: React.FC<RagChatPanelProps> = ({
  initialScope,
  selectedDocument,
  selectedFolder,
  selectedDepartment,
  availableDocuments = [],
}) => {
  const documentContext = selectedDocument ? {
    document_id: selectedDocument.id,
    document_name: selectedDocument.name,
    folder_id: selectedDocument.folder_id,
    folder_name: selectedFolder?.name
  } : undefined;

  const { messages, isLoading, askQuestion, clearChat } = useRagChatWithPersistence(undefined, documentContext);
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<ChatScope>(
    initialScope || { type: 'global', name: 'Global' }
  );
  const [expandedSources, setExpandedSources] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | undefined>(selectedDocument?.id);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update scope when selections change
  useEffect(() => {
    if (initialScope) {
      setScope(initialScope);
    } else if (selectedDocument) {
      setScope({
        type: 'document',
        id: selectedDocument.id,
        name: selectedDocument.name,
      });
    } else if (selectedFolder) {
      setScope({
        type: 'folder',
        id: selectedFolder.id,
        name: selectedFolder.name,
      });
    } else if (selectedDepartment) {
      setScope({
        type: 'department',
        id: selectedDepartment.id,
        name: selectedDepartment.name,
      });
    }
  }, [initialScope, selectedDocument, selectedFolder, selectedDepartment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const currentQuery = query;
    setQuery('');
    await askQuestion(currentQuery, scope);
  };

  const handleScopeChange = (newScopeType: string) => {
    let newScope: ChatScope;
    
    switch (newScopeType) {
      case 'document':
        if (selectedDocumentId && availableDocuments.length > 0) {
          const doc = availableDocuments.find(d => d.id === selectedDocumentId);
          newScope = doc 
            ? { type: 'document', id: doc.id, name: doc.name }
            : { type: 'global', name: 'Global' };
        } else if (selectedDocument) {
          newScope = { type: 'document', id: selectedDocument.id, name: selectedDocument.name };
        } else {
          newScope = { type: 'global', name: 'Global' };
        }
        break;
      case 'folder':
        // Clear selected document when switching to folder scope
        setSelectedDocumentId(undefined);
        newScope = selectedFolder
          ? { type: 'folder', id: selectedFolder.id, name: selectedFolder.name }
          : { type: 'global', name: 'Global' };
        break;
      case 'department':
        // Clear selected document when switching to department scope
        setSelectedDocumentId(undefined);
        newScope = selectedDepartment
          ? { type: 'department', id: selectedDepartment.id, name: selectedDepartment.name }
          : { type: 'global', name: 'Global' };
        break;
      default:
        setSelectedDocumentId(undefined);
        newScope = { type: 'global', name: 'Global' };
    }
    
    setScope(newScope);
  };

  const handleDocumentSelect = (documentId: string) => {
    setSelectedDocumentId(documentId);
    const doc = availableDocuments.find(d => d.id === documentId);
    if (doc) {
      setScope({ type: 'document', id: doc.id, name: doc.name });
    }
  };

  const handleDownloadDocument = async (documentId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('download-doc', {
        body: { id: documentId }
      });
      
      if (error) throw error;
      
      if (data?.download_url) {
        window.open(data.download_url, '_blank');
        toast({
          title: "Download iniciado",
          description: `Arquivo: ${data.filename}`,
        });
      }
    } catch (error: any) {
      console.error('Erro no download:', error);
      toast({
        title: "Erro no download",
        description: error.message || "Não foi possível baixar o documento",
        variant: "destructive"
      });
    }
  };

  const getScopeDisplayName = () => {
    switch (scope.type) {
      case 'document':
        return `Documento: ${scope.name}`;
      case 'folder':
        return `Pasta: ${scope.name}`;
      case 'department':
        return `Departamento: ${scope.name}`;
      default:
        return 'Busca Global';
    }
  };

  const renderMessage = (message: ChatMessage) => (
    <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          message.type === 'user' 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-secondary text-secondary-foreground'
        }`}>
          {message.type === 'user' ? <User size={16} /> : <Bot size={16} />}
        </div>
        <div className={`rounded-lg p-4 ${
          message.type === 'user' 
            ? 'bg-primary text-primary-foreground ml-auto' 
            : 'bg-muted'
        }`}>
          <div className="whitespace-pre-wrap">{message.content}</div>
          {message.type === 'ai' && message.modelUsed && (
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                {message.modelUsed === 'gpt-5-2025-08-07' ? 'GPT-5' : 
                 message.modelUsed === 'gpt-5-nano-2025-08-07' ? 'GPT-5 Nano' : 
                 message.modelUsed}
              </Badge>
            </div>
          )}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={14} />
                <span className="text-sm font-medium">Fontes ({new Set(message.sources.map(s => s.document_id)).size} arquivos)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedSources(
                    expandedSources === message.id ? null : message.id
                  )}
                >
                  {expandedSources === message.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </Button>
              </div>
              {expandedSources === message.id && (
                <div className="space-y-2">
                  {message.sources.map((source, index) => (
                    <div key={`${source.document_id}-${source.chunk_index}`} className="flex items-start gap-2 p-2 bg-background rounded text-sm">
                      <Badge variant="outline" className="min-w-fit">
                        [{index + 1}]
                      </Badge>
                       <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {source.filename}
                            {source.page_number && ` (Página ${source.page_number})`}
                            {source.slide_number && ` (Slide ${source.slide_number})`}
                          </div>
                          <div className="flex items-center gap-2 text-xs mt-1">
                            <span className="text-muted-foreground">{source.snippet}</span>
                            {source.extraction_source && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                {source.extraction_source === 'pdf_js' ? 'Texto' :
                                 source.extraction_source === 'ocr' ? 'OCR' :
                                 source.extraction_source === 'semantic_chunker' ? 'IA' :
                                 source.extraction_source}
                              </Badge>
                            )}
                          </div>
                       </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadDocument(source.document_id)}
                          title="Baixar documento"
                        >
                          <Download size={12} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Save folder ID to localStorage for DocumentManagement to read
                            localStorage.setItem('doc-mgmt-selected-node', JSON.stringify({
                              id: source.folder_id,
                              type: 'folder'
                            }));
                            // Open in new tab
                            window.open(`/gestao/documentos?folder=${source.folder_id}`, '_blank');
                            toast({
                              title: "Abrindo pasta",
                              description: "Navegando para a pasta do documento",
                            });
                          }}
                          title="Abrir na pasta"
                        >
                          <FolderOpen size={12} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-4xl mx-auto h-full min-h-[400px] flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Assistente IA - Documentos
          </CardTitle>
          <Button variant="outline" size="sm" onClick={clearChat}>
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex-1">
            <Select value={scope.type} onValueChange={handleScopeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Busca Global</SelectItem>
                <SelectItem value="document">Documento Específico</SelectItem>
                {selectedFolder && (
                  <SelectItem value="folder">Pasta Atual</SelectItem>
                )}
                {selectedDepartment && (
                  <SelectItem value="department">Departamento Atual</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          {scope.type === 'document' && availableDocuments.length > 0 && (
            <div className="flex-1">
              <DocumentSelector
                availableDocuments={availableDocuments}
                selectedDocumentId={selectedDocumentId}
                onDocumentSelect={handleDocumentSelect}
                placeholder="Escolha um documento..."
              />
            </div>
          )}
          <Badge variant="secondary" className="whitespace-nowrap">
            {getScopeDisplayName()}
          </Badge>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 flex flex-col p-4">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Faça uma pergunta sobre os documentos!</p>
              <p className="text-sm mt-2">
                Exemplos: "Quais são os principais tópicos?", "Existe informação sobre X?"
              </p>
            </div>
          ) : (
            messages.map(renderMessage)
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite sua pergunta..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !query.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};