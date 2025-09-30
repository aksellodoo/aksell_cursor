import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Search, Eye, EyeOff, FolderOpen, Folder, File } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useDocumentTree } from '@/hooks/useDocumentTree';
import { useDocumentActions } from '@/hooks/useDocumentActions';
import { TreeNode } from '@/components/TreeNode';
import { Breadcrumb } from '@/components/Breadcrumb';
import type { DocumentTreeItem, DocumentItem, BreadcrumbItem } from '@/pages/DocumentManagement';

interface DocumentSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentSelect: (documentId: string, documentName: string) => void;
  selectedDocumentId?: string;
}

export const DocumentSelectionModal: React.FC<DocumentSelectionModalProps> = ({
  open,
  onOpenChange,
  onDocumentSelect,
  selectedDocumentId
}) => {
  const [selectedNode, setSelectedNode] = useState<DocumentTreeItem | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [includeHidden, setIncludeHidden] = useState(false);
  const [tempSelectedDocumentId, setTempSelectedDocumentId] = useState<string>('');
  const [tempSelectedDocumentName, setTempSelectedDocumentName] = useState<string>('');

  // Hooks
  const { tree, loading: treeLoading } = useDocumentTree({ includeHidden });
  const { documents, loading: docsLoading } = useDocumentActions(selectedNode?.id);

  // Reset temp selection when modal opens
  useEffect(() => {
    if (open) {
      setTempSelectedDocumentId(selectedDocumentId || '');
      setTempSelectedDocumentName('');
    }
  }, [open, selectedDocumentId]);

  // Breadcrumb calculation
  const breadcrumbs = useMemo((): BreadcrumbItem[] => {
    if (!selectedNode) return [];
    
    const buildPath = (node: DocumentTreeItem): BreadcrumbItem[] => {
      if (node.type === 'department') {
        return [{ id: node.id, name: node.name, type: 'department' }];
      }
      
      // Find parent folder in tree
      const findParent = (nodes: DocumentTreeItem[], nodeId: string): DocumentTreeItem | null => {
        for (const n of nodes) {
          if (n.children.some(child => child.id === nodeId)) return n;
          const found = findParent(n.children, nodeId);
          if (found) return found;
        }
        return null;
      };

      const parent = findParent(tree, node.id);
      if (parent) {
        return [...buildPath(parent), { id: node.id, name: node.name, type: 'folder' }];
      }
      
      return [{ id: node.id, name: node.name, type: 'folder' }];
    };

    return buildPath(selectedNode);
  }, [selectedNode, tree]);

  const handleNodeSelect = useCallback((node: DocumentTreeItem) => {
    setSelectedNode(node);
  }, []);

  const handleNodeToggle = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const handleBreadcrumbClick = useCallback((item: BreadcrumbItem) => {
    const findNodeById = (nodes: DocumentTreeItem[], id: string): DocumentTreeItem | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
      return null;
    };

    const node = findNodeById(tree, item.id);
    if (node) {
      setSelectedNode(node);
    }
  }, [tree]);

  const handleDocumentSelect = useCallback((documentId: string, documentName: string) => {
    setTempSelectedDocumentId(documentId);
    setTempSelectedDocumentName(documentName);
  }, []);

  const handleConfirmSelection = useCallback(() => {
    if (tempSelectedDocumentId && tempSelectedDocumentName) {
      onDocumentSelect(tempSelectedDocumentId, tempSelectedDocumentName);
      onOpenChange(false);
    }
  }, [tempSelectedDocumentId, tempSelectedDocumentName, onDocumentSelect, onOpenChange]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return File;
    if (mimeType.startsWith('image/')) return File;
    if (mimeType.includes('pdf')) return File;
    if (mimeType.includes('word') || mimeType.includes('document')) return File;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return File;
    return File;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'processing': return 'bg-warning text-warning-foreground';
      case 'error': return 'bg-destructive text-destructive-foreground';
      case 'archived': return 'bg-muted text-muted-foreground';
      case 'hidden': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Selecionar Arquivo</DialogTitle>
        </DialogHeader>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4 border-b pb-4">
          <Breadcrumb items={breadcrumbs} onItemClick={handleBreadcrumbClick} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIncludeHidden(!includeHidden)}
            className="flex items-center gap-2"
          >
            {includeHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {includeHidden ? 'Ocultar arquivados' : 'Mostrar arquivados'}
          </Button>
        </div>

        {/* Main content */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Left side - Tree */}
          <div className="w-80 border-r pr-4 overflow-auto">
            <div className="space-y-1">
              {treeLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Carregando estrutura...
                </div>
              ) : (
                tree.map((node) => (
                  <TreeNode
                    key={node.id}
                    node={node}
                    level={0}
                    isSelected={selectedNode?.id === node.id}
                    isExpanded={expandedNodes.has(node.id)}
                    onSelect={handleNodeSelect}
                    onToggle={handleNodeToggle}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right side - Documents */}
          <div className="flex-1 overflow-auto">
            {!selectedNode ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione uma pasta para ver os documentos</p>
                </div>
              </div>
            ) : docsLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Carregando documentos...
              </div>
            ) : documents.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum documento encontrado nesta pasta</p>
                </div>
              </div>
            ) : (
              <RadioGroup
                value={tempSelectedDocumentId}
                onValueChange={(value) => {
                  const doc = documents.find(d => d.id === value);
                  if (doc) {
                    handleDocumentSelect(value, doc.name);
                  }
                }}
                className="space-y-2"
              >
                {documents.map((document) => {
                  const FileIcon = getFileIcon(document.mime_type);
                  return (
                    <div
                      key={document.id}
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors",
                        tempSelectedDocumentId === document.id && "bg-accent border-primary"
                      )}
                    >
                      <RadioGroupItem value={document.id} id={document.id} />
                      <Label
                        htmlFor={document.id}
                        className="flex items-center space-x-3 flex-1 cursor-pointer"
                      >
                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{document.name}</span>
                            <Badge className={cn("text-xs", getStatusColor(document.status))}>
                              {document.status === 'active' ? 'Ativo' :
                               document.status === 'processing' ? 'Processando' :
                               document.status === 'error' ? 'Erro' :
                               document.status === 'archived' ? 'Arquivado' : 'Oculto'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {document.file_size && formatFileSize(document.file_size)}
                            {document.mime_type && ` • ${document.mime_type}`}
                          </div>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmSelection}
            disabled={!tempSelectedDocumentId}
          >
            Selecionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};