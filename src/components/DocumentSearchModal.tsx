import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Folder, File } from 'lucide-react';

interface DocumentSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (query: string, options?: { tab?: 'folders' | 'files' }) => void;
  searchResults?: any[];
  searchTab?: 'folders' | 'files';
  onSearchTabChange?: (tab: 'folders' | 'files') => void;
  onResultClick?: (result: any) => void;
  includeHidden?: boolean;
}

export const DocumentSearchModal: React.FC<DocumentSearchModalProps> = ({
  open,
  onOpenChange,
  onSearch,
  searchResults = [],
  searchTab = 'folders',
  onSearchTabChange,
  onResultClick,
  includeHidden = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'folders' | 'files'>(searchTab);

  const handleSearch = () => {
    onSearch(searchQuery, { tab: activeTab });
    if (!searchResults.length) {
      onOpenChange(false);
    }
  };

  const handleTabChange = (tab: 'folders' | 'files') => {
    setActiveTab(tab);
    onSearchTabChange?.(tab);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Busca Global de Documentos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Digite sua busca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10"
              autoFocus
            />
          </div>

          <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as 'folders' | 'files')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="folders">Pastas</TabsTrigger>
              <TabsTrigger value="files">Arquivos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="folders" className="mt-4">
              <div className="space-y-3">
                {searchResults.length > 0 ? (
                  <div className="max-h-60 overflow-auto space-y-2">
                    {searchResults.filter(r => r.section === 'folder' || !r.section).map((result, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => onResultClick?.(result)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Folder className="h-4 w-4 text-amber-600" />
                          <h4 className="font-medium text-sm">{result.filename || result.folder_name}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {result.content?.substring(0, 100)}...
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {searchQuery ? 'Nenhuma pasta encontrada.' : 'Digite algo para buscar pastas.'}
                  </p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="files" className="mt-4">
              <div className="space-y-3">
                {searchResults.length > 0 ? (
                  <div className="max-h-60 overflow-auto space-y-2">
                    {searchResults.filter(r => r.document_id || r.section !== 'folder').map((result, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => onResultClick?.(result)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <File className="h-4 w-4 text-blue-600" />
                          <h4 className="font-medium text-sm">{result.filename}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Relevância: {result.distance?.toFixed(3)} | Seção: {result.section || 'Conteúdo'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {result.content?.substring(0, 150)}...
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {searchQuery ? 'Nenhum arquivo encontrado.' : 'Digite algo para buscar arquivos.'}
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Pressione <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> para buscar ou <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> para fechar
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSearch} disabled={!searchQuery.trim()}>
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};