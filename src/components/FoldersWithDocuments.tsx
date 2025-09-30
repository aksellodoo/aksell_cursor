import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Folder, FolderOpen, FileText, Upload, Plus, Eye, Archive, EyeOff } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useDepartmentFolders } from '@/hooks/useDepartmentFolders';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

interface FolderWithDocuments {
  id: string;
  name: string;
  status: 'active' | 'archived' | 'hidden';
  is_root: boolean;
  doc_count: number;
  documents?: Array<{
    id: string;
    name: string;
    status: 'processing' | 'active' | 'error';
    file_size?: number;
    created_at: string;
  }>;
}

interface FoldersWithDocumentsProps {
  departmentId: string;
}

export const FoldersWithDocuments: React.FC<FoldersWithDocumentsProps> = ({ departmentId }) => {
  const navigate = useNavigate();
  const { folders, loading, refetch } = useDepartmentFolders(departmentId);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [documentsMap, setDocumentsMap] = useState<Record<string, FolderWithDocuments['documents']>>({});
  const [loadingDocuments, setLoadingDocuments] = useState<Set<string>>(new Set());

  const toggleFolder = async (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    
    if (expandedFolders.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
      
      // Load documents for this folder if not already loaded
      if (!documentsMap[folderId]) {
        await loadFolderDocuments(folderId);
      }
    }
    
    setExpandedFolders(newExpanded);
  };

  const loadFolderDocuments = async (folderId: string) => {
    setLoadingDocuments(prev => new Set(prev).add(folderId));
    
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, name, file_size, created_at')
        .eq('folder_id', folderId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map the documents to include a mock status since it's not in the table yet
      const documentsWithStatus = (data || []).map(doc => ({
        ...doc,
        status: 'active' as const // Default status for now
      }));

      setDocumentsMap(prev => ({
        ...prev,
        [folderId]: documentsWithStatus
      }));
    } catch (error) {
      console.error('Error loading folder documents:', error);
    } finally {
      setLoadingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(folderId);
        return newSet;
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-500';
      case 'active':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processing':
        return 'Processando';
      case 'active':
        return 'Ativo';
      case 'error':
        return 'Erro';
      default:
        return status;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleUploadComplete = () => {
    // Refresh folders to update counts
    refetch();
    
    // Refresh documents for expanded folders
    expandedFolders.forEach(folderId => {
      loadFolderDocuments(folderId);
    });
  };

  const activeFolders = folders.filter(folder => folder.status === 'active');
  const archivedFolders = folders.filter(folder => folder.status === 'archived');
  const hiddenFolders = folders.filter(folder => folder.status === 'hidden');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pastas e Documentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (folders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pastas e Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhuma pasta encontrada neste departamento.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderFolderGroup = (foldersList: typeof folders, title: string, icon: React.ReactNode) => {
    if (foldersList.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
          {icon}
          <span>{title} ({foldersList.length})</span>
        </div>
        
        {foldersList.map((folder) => {
          const isExpanded = expandedFolders.has(folder.id);
          const folderDocuments = documentsMap[folder.id] || [];
          const isLoadingDocs = loadingDocuments.has(folder.id);

          return (
            <Collapsible key={folder.id} open={isExpanded} onOpenChange={() => toggleFolder(folder.id)}>
              <Card className="overflow-hidden">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {isExpanded ? 
                          <FolderOpen className="h-5 w-5 text-primary" /> : 
                          <Folder className="h-5 w-5 text-muted-foreground" />
                        }
                        <CardTitle className="text-base">{folder.name}</CardTitle>
                        {folder.is_root && (
                          <Badge variant="outline" className="text-xs">Raiz</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {folder.doc_count} doc{folder.doc_count !== 1 ? 's' : ''}
                        </Badge>
                        {folder.status === 'archived' && <Archive className="h-4 w-4 text-muted-foreground" />}
                        {folder.status === 'hidden' && <EyeOff className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {/* Import Section - only for active folders */}
                    {folder.status === 'active' && (
                      <div className="mb-4 p-4 border rounded-lg bg-muted/30">
                        <h4 className="text-sm font-medium mb-3 flex items-center">
                          <Upload className="h-4 w-4 mr-2" />
                          Importar Documentos
                        </h4>
                        <Button 
                          onClick={() => navigate(`/gestao/documentos/importar?departmentId=${departmentId}&folderId=${folder.id}`)}
                          className="w-full"
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Importar Documentos
                        </Button>
                      </div>
                    )}

                    {/* Documents List */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Documentos
                      </h4>
                      
                      {isLoadingDocs ? (
                        <div className="space-y-2">
                          {Array.from({ length: 2 }).map((_, i) => (
                            <Skeleton key={i} className="h-8 w-full" />
                          ))}
                        </div>
                      ) : folderDocuments.length > 0 ? (
                        <div className="space-y-2">
                          {folderDocuments.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-2 border rounded text-sm">
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="truncate">{doc.name}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                {doc.file_size && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatFileSize(doc.file_size)}
                                  </span>
                                )}
                                <div className={`w-2 h-2 rounded-full ${getStatusColor(doc.status)}`} title={getStatusText(doc.status)} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground py-2">
                          Nenhum documento encontrado
                        </p>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pastas e Documentos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderFolderGroup(activeFolders, 'Pastas Ativas', <Eye className="h-4 w-4" />)}
        {renderFolderGroup(archivedFolders, 'Pastas Arquivadas', <Archive className="h-4 w-4" />)}
        {renderFolderGroup(hiddenFolders, 'Pastas Ocultas', <EyeOff className="h-4 w-4" />)}
      </CardContent>
    </Card>
  );
};