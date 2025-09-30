import React, { useState, useEffect } from 'react';
import { Send, FileText, Folder, Building2, Globe, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRagChatWithPersistence } from '@/hooks/useRagChatWithPersistence';
import { ChatScope } from '@/hooks/useRagChatWithPersistence';
import { DocumentSelector } from './DocumentSelector';
import { useToast } from '@/hooks/use-toast';

interface RagChatInterfaceProps {
  conversationId?: string;
  availableDocuments?: Array<{ id: string; name: string; folder_id: string }>;
  availableFolders?: Array<{ id: string; name: string; department_id: string }>;
  availableDepartments?: Array<{ id: string; name: string }>;
  documentContext?: {
    document_id?: string;
    document_name?: string;
    folder_id?: string;
    folder_name?: string;
  };
  conversationScope?: any;
}

export const RagChatInterface: React.FC<RagChatInterfaceProps> = ({
  conversationId,
  availableDocuments = [],
  availableFolders = [],
  availableDepartments = [],
  documentContext,
  conversationScope
}) => {
  const [query, setQuery] = useState('');
  const [scopeType, setScopeType] = useState<'document' | 'folder' | 'department' | 'global'>('global');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  
  const { messages, isLoading, error, askQuestion, clearChat } = useRagChatWithPersistence(conversationId, documentContext);
  const { toast } = useToast();

  // Initialize scope and document when documentContext is provided
  useEffect(() => {
    if (documentContext?.document_id) {
      setScopeType('document');
      setSelectedDocumentId(documentContext.document_id);
    }
  }, [documentContext]);

  // Apply conversation scope when conversation is loaded
  useEffect(() => {
    if (conversationScope) {
      setScopeType(conversationScope.type || 'global');
      
      if (conversationScope.type === 'document' && conversationScope.id) {
        setSelectedDocumentId(conversationScope.id);
      } else if (conversationScope.type === 'folder' && conversationScope.id) {
        setSelectedFolderId(conversationScope.id);
      } else if (conversationScope.type === 'department' && conversationScope.id) {
        setSelectedDepartmentId(conversationScope.id);
      }
    }
  }, [conversationScope]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const scope: ChatScope = {
      type: scopeType,
      id: scopeType === 'document' ? selectedDocumentId : 
          scopeType === 'folder' ? selectedFolderId : 
          scopeType === 'department' ? selectedDepartmentId : undefined
    };

    try {
      await askQuestion(query, scope);
      setQuery('');
    } catch (err) {
      toast({
        title: "Erro",
        description: "Falha ao enviar pergunta. Tente novamente.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Chat Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Perguntas aos Documentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scope Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Escopo da Busca</label>
              <Select value={scopeType} onValueChange={(value: any) => setScopeType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>Global (todos os documentos)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="department">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>Departamento específico</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="folder">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      <span>Pasta específica</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="document">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Documento específico</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Scope-specific selectors */}
            <div>
              {scopeType === 'document' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Documento</label>
                  <DocumentSelector
                    availableDocuments={availableDocuments}
                    selectedDocumentId={selectedDocumentId}
                    onDocumentSelect={setSelectedDocumentId}
                    placeholder="Selecione um documento..."
                  />
                </div>
              )}

              {scopeType === 'folder' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Pasta</label>
                  <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                    <SelectTrigger>
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        <SelectValue placeholder="Selecione uma pasta..." />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {availableFolders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          <div className="flex items-center gap-2">
                            <Folder className="h-4 w-4" />
                            <span className="truncate">{folder.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                      {availableFolders.length === 0 && (
                        <SelectItem value="" disabled>
                          Nenhuma pasta disponível
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {scopeType === 'department' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Departamento</label>
                  <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
                    <SelectTrigger>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <SelectValue placeholder="Selecione um departamento..." />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {availableDepartments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span className="truncate">{dept.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                      {availableDepartments.length === 0 && (
                        <SelectItem value="" disabled>
                          Nenhum departamento disponível
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Faça uma pergunta sobre os documentos para começar</p>
                <p className="text-sm mt-2">Selecione o escopo da busca acima e digite sua pergunta</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.type === 'ai' && message.modelUsed && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Modelo: {message.modelUsed}
                      </div>
                    )}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-xs font-medium mb-2">Fontes:</p>
                        <div className="space-y-2">
                          {message.sources.map((source, idx) => {
                            // Format page/slide reference
                            const formatReference = () => {
                              if (source.page_number) {
                                return `Página ${source.page_number}`;
                              }
                              if (source.slide_number) {
                                return `Slide ${source.slide_number}`;
                              }
                              if (source.section) {
                                return source.section;
                              }
                              return `Seção ${source.chunk_index}`;
                            };

                            const reference = formatReference();
                            const sourceType = source.extraction_source ? ` (${source.extraction_source})` : '';
                            
                            return (
                              <div key={idx} className="text-xs bg-background/50 rounded p-2 border">
                                <div className="flex items-start gap-2">
                                  <FileText className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-foreground">
                                      {source.filename}
                                    </div>
                                    <div className="text-muted-foreground">
                                      {reference}{sourceType}
                                    </div>
                                    {source.snippet && (
                                      <div className="mt-1 text-xs text-muted-foreground/80 line-clamp-2">
                                        "{source.snippet.substring(0, 120)}..."
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Buscando informações...</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}
        </CardContent>

        {/* Chat Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite sua pergunta sobre os documentos..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={!query.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          
          {messages.length > 0 && (
            <div className="flex justify-between items-center mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                disabled={isLoading}
              >
                Limpar conversa
              </Button>
              <p className="text-xs text-muted-foreground">
                Pressione Enter para enviar
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};