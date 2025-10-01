import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search, Eye, EyeOff, FolderOpen, Folder, File, Grid3x3, List,
  Clock, Star, TrendingUp, FileText, Image, FileSpreadsheet,
  FileVideo, FileArchive, X, Filter, Plus, Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useDocumentTree } from '@/hooks/useDocumentTree';
import { useDocumentActions } from '@/hooks/useDocumentActions';
import { useDocumentSearch } from '@/hooks/useDocumentSearch';
import { useRecentDocuments } from '@/hooks/useRecentDocuments';
import { useFavoriteDocuments } from '@/hooks/useFavoriteDocuments';
import { usePopularDocuments } from '@/hooks/usePopularDocuments';
import { TreeNode } from '@/components/TreeNode';
import { Breadcrumb } from '@/components/Breadcrumb';
import { FolderCard } from '@/components/FolderCard';
import { SearchBarEnhanced } from '@/components/SearchBarEnhanced';
import type { DocumentTreeItem, DocumentItem, BreadcrumbItem } from '@/pages/DocumentManagement';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Import wizard components
import { ImportWizardProvider, useImportWizard } from '@/components/document-import/ImportWizard';
import { StepIndicator } from '@/components/document-import/ImportWizard';
import { FileQuantityStep } from '@/components/document-import/FileQuantityStep';
import { FileTypeStep } from '@/components/document-import/FileTypeStep';
import { FileUploadStep } from '@/components/document-import/FileUploadStep';
import { ProcessingOptionsStep } from '@/components/document-import/ProcessingOptionsStep';
import { VersioningStep } from '@/components/document-import/VersioningStep';
import { ApprovalStep } from '@/components/document-import/ApprovalStep';
import { ReviewApprovalStep } from '@/components/document-import/ReviewApprovalStep';
import { ProcessingProgressModal } from '@/components/document-import/ProcessingProgressModal';
import { useProcessingOrchestrator } from '@/hooks/useProcessingOrchestrator';
import { toast as sonnerToast } from 'sonner';

interface DocumentSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentSelect: (documentId: string, documentName: string) => void;
  onMultipleDocumentsSelect?: (documents: Array<{id: string, name: string}>) => void;
  selectedDocumentId?: string;
  allowMultiple?: boolean;
}

export const DocumentSelectionModal: React.FC<DocumentSelectionModalProps> = ({
  open,
  onOpenChange,
  onDocumentSelect,
  onMultipleDocumentsSelect,
  selectedDocumentId,
  allowMultiple = false
}) => {
  const [selectedNode, setSelectedNode] = useState<DocumentTreeItem | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [includeHidden, setIncludeHidden] = useState(false);
  const [tempSelectedDocumentId, setTempSelectedDocumentId] = useState<string>('');
  const [tempSelectedDocumentName, setTempSelectedDocumentName] = useState<string>('');
  const [tempSelectedDocuments, setTempSelectedDocuments] = useState<Array<{id: string, name: string}>>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'browse' | 'recent' | 'favorites' | 'popular'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Import wizard states
  const [mode, setMode] = useState<'selection' | 'import'>('selection');
  const [showImportWizard, setShowImportWizard] = useState(false);

  // Hooks
  const { tree, loading: treeLoading, refetch: refetchTree } = useDocumentTree({ includeHidden });
  const { documents, loading: docsLoading, refetch: refetchDocuments } = useDocumentActions(selectedNode?.id);
  const { searchDocuments, loading: searchLoading } = useDocumentSearch();
  const { recentDocuments, loading: recentLoading } = useRecentDocuments(10);
  const { favoriteDocuments, loading: favoritesLoading } = useFavoriteDocuments();
  const { popularDocuments, loading: popularLoading } = usePopularDocuments(10);

  // Processing orchestrator for import wizard
  const {
    isProcessing,
    isCompleted,
    hasErrors,
    steps,
    logs,
    canForceStop,
    processFiles,
    forceStop,
    reset: resetProcessing
  } = useProcessingOrchestrator();

  // Reset temp selection when modal opens
  useEffect(() => {
    if (open) {
      setTempSelectedDocumentId(selectedDocumentId || '');
      setTempSelectedDocumentName('');
      setTempSelectedDocuments([]);
      setSearchQuery('');
      setFileTypeFilter('all');
      setStatusFilter('all');
      setMode('selection');
      setShowImportWizard(false);
    }
  }, [open, selectedDocumentId]);

  // Listen for processing events from import wizard
  useEffect(() => {
    const handleStartProcessing = async (event: CustomEvent) => {
      console.log('📨 DocumentSelectionModal received startProcessing event:', event.detail);

      const { files, config, folderId, departmentId } = event.detail;

      // Validations
      if (!files || files.length === 0) {
        console.error('❌ No files provided to processing');
        sonnerToast.error('Nenhum arquivo foi fornecido para processamento.');
        return;
      }

      if (!departmentId) {
        console.error('❌ Missing department ID');
        sonnerToast.error('ID do departamento não encontrado.');
        return;
      }

      console.log('🚀 Starting processing with:', {
        filesCount: files.length,
        config,
        folderId,
        departmentId
      });

      // Call processFiles from orchestrator
      await processFiles(files, config, folderId || '', departmentId);
    };

    window.addEventListener('startProcessing', handleStartProcessing as EventListener);

    return () => {
      window.removeEventListener('startProcessing', handleStartProcessing as EventListener);
    };
  }, [processFiles]);

  // Get current folders (children of selected node)
  const currentFolders = useMemo(() => {
    if (!selectedNode || !tree) return [];

    const findNode = (nodes: DocumentTreeItem[]): DocumentTreeItem | null => {
      for (const node of nodes) {
        if (node.id === selectedNode.id) return node;
        const found = findNode(node.children);
        if (found) return found;
      }
      return null;
    };

    const node = findNode(tree);
    return node?.children.filter(child => child.type === 'folder') || [];
  }, [selectedNode, tree]);

  // Filter documents based on filters
  const filteredDocuments = useMemo(() => {
    let filtered = documents || [];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(query)
      );
    }

    // File type filter
    if (fileTypeFilter !== 'all') {
      filtered = filtered.filter(doc => {
        if (!doc.mime_type) return false;
        switch (fileTypeFilter) {
          case 'pdf':
            return doc.mime_type.includes('pdf');
          case 'image':
            return doc.mime_type.startsWith('image/');
          case 'document':
            return doc.mime_type.includes('word') || doc.mime_type.includes('document');
          case 'spreadsheet':
            return doc.mime_type.includes('excel') || doc.mime_type.includes('spreadsheet');
          default:
            return true;
        }
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(doc => doc.status === statusFilter);
    }

    return filtered;
  }, [documents, searchQuery, fileTypeFilter, statusFilter]);

  // Breadcrumb calculation
  const breadcrumbs = useMemo((): BreadcrumbItem[] => {
    const baseBreadcrumb: BreadcrumbItem[] = [{ id: 'root', name: 'Selecionar Arquivo', type: 'department' }];

    if (!selectedNode) return baseBreadcrumb;

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

    return [...baseBreadcrumb, ...buildPath(selectedNode)];
  }, [selectedNode, tree]);

  const handleNodeSelect = useCallback((node: DocumentTreeItem) => {
    setSelectedNode(node);
    setActiveTab('browse');
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
    if (item.id === 'root') {
      setSelectedNode(null);
      return;
    }

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
    if (allowMultiple) {
      // Toggle selection in multiple mode
      setTempSelectedDocuments(prev => {
        const exists = prev.find(doc => doc.id === documentId);
        if (exists) {
          // Remove if already selected
          return prev.filter(doc => doc.id !== documentId);
        } else {
          // Add to selection
          return [...prev, { id: documentId, name: documentName }];
        }
      });
    } else {
      // Single selection mode
      setTempSelectedDocumentId(documentId);
      setTempSelectedDocumentName(documentName);
    }
  }, [allowMultiple]);

  const handleConfirmSelection = useCallback(() => {
    if (allowMultiple) {
      if (tempSelectedDocuments.length > 0 && onMultipleDocumentsSelect) {
        onMultipleDocumentsSelect(tempSelectedDocuments);
        onOpenChange(false);
      }
    } else {
      if (tempSelectedDocumentId && tempSelectedDocumentName) {
        onDocumentSelect(tempSelectedDocumentId, tempSelectedDocumentName);
        onOpenChange(false);
      }
    }
  }, [allowMultiple, tempSelectedDocuments, tempSelectedDocumentId, tempSelectedDocumentName, onMultipleDocumentsSelect, onDocumentSelect, onOpenChange]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return FileText;
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.includes('pdf')) return FileText;
    if (mimeType.includes('word') || mimeType.includes('document')) return FileText;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return FileSpreadsheet;
    if (mimeType.includes('video')) return FileVideo;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return FileArchive;
    return File;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'processing': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'error': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'archived': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      case 'hidden': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const renderDocumentCard = (document: DocumentItem, isQuickAccess = false) => {
    const FileIcon = getFileIcon(document.mime_type);
    const isSelected = allowMultiple
      ? tempSelectedDocuments.some(doc => doc.id === document.id)
      : tempSelectedDocumentId === document.id;

    if (viewMode === 'grid') {
      return (
        <div
          key={document.id}
          onClick={() => handleDocumentSelect(document.id, document.name)}
          className={cn(
            "group relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md",
            isSelected ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/50"
          )}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className={cn(
              "p-4 rounded-lg transition-colors",
              isSelected ? "bg-primary/10" : "bg-muted group-hover:bg-primary/5"
            )}>
              <FileIcon className={cn(
                "h-8 w-8 transition-colors",
                isSelected ? "text-primary" : "text-muted-foreground group-hover:text-primary"
              )} />
            </div>

            <div className="w-full space-y-2">
              <p className="font-medium text-sm truncate" title={document.name}>
                {document.name}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-1">
                <Badge variant="secondary" className="text-xs">
                  {document.file_size ? formatFileSize(document.file_size) : 'N/A'}
                </Badge>
                <Badge className={cn("text-xs", getStatusColor(document.status))}>
                  {document.status === 'active' ? 'Ativo' :
                   document.status === 'processing' ? 'Processando' :
                   document.status === 'error' ? 'Erro' :
                   document.status === 'archived' ? 'Arquivado' : 'Oculto'}
                </Badge>
              </div>

              {document.updated_at && (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(document.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              )}
            </div>

            <div className="absolute top-2 right-2">
              {allowMultiple ? (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(e) => {
                    e.stopPropagation();
                  }}
                  className="h-5 w-5"
                />
              ) : (
                isSelected && (
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <svg className="h-4 w-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      );
    } else {
      // List view
      return (
        <div
          key={document.id}
          onClick={() => handleDocumentSelect(document.id, document.name)}
          className={cn(
            "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all",
            isSelected ? "bg-primary/5 border-primary shadow-sm" : "hover:bg-accent/50 border-border"
          )}
        >
          <div className={cn(
            "p-2 rounded",
            isSelected ? "bg-primary/10" : "bg-muted"
          )}>
            <FileIcon className={cn(
              "h-5 w-5",
              isSelected ? "text-primary" : "text-muted-foreground"
            )} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{document.name}</span>
              {allowMultiple ? (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(e) => {
                    e.stopPropagation();
                  }}
                  className="h-4 w-4 flex-shrink-0"
                />
              ) : (
                isSelected && (
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {document.file_size && <span>{formatFileSize(document.file_size)}</span>}
              {document.updated_at && (
                <>
                  <span>•</span>
                  <span>{format(new Date(document.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                </>
              )}
            </div>
          </div>

          <Badge className={cn("text-xs", getStatusColor(document.status))}>
            {document.status === 'active' ? 'Ativo' :
             document.status === 'processing' ? 'Processando' :
             document.status === 'error' ? 'Erro' :
             document.status === 'archived' ? 'Arquivado' : 'Oculto'}
          </Badge>
        </div>
      );
    }
  };

  const renderQuickAccessSection = (
    documents: DocumentItem[] | undefined,
    icon: React.ReactNode,
    title: string,
    emptyMessage: string
  ) => {
    if (!documents || documents.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          {icon}
          <p className="mt-4 text-center">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className={cn(
        "gap-4",
        viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "space-y-2"
      )}>
        {documents.map(doc => renderDocumentCard(doc, true))}
      </div>
    );
  };

  // Component for rendering wizard step content
  const WizardStepContent: React.FC = () => {
    const { currentStep } = useImportWizard();

    switch (currentStep) {
      case 0: return <FileQuantityStep />;
      case 1: return <FileTypeStep />;
      case 2: return <FileUploadStep />;
      case 3: return <VersioningStep />;
      case 4: return <ApprovalStep />;
      case 5: return <ReviewApprovalStep />;
      default: return <FileQuantityStep />;
    }
  };

  // Handle completion of import and return to selection mode
  const handleImportComplete = useCallback(async () => {
    console.log('🎉 Import complete, refreshing document list...');

    // Refetch documents in current folder
    await refetchDocuments();
    await refetchTree();

    // Return to selection mode
    setMode('selection');
    setShowImportWizard(false);

    // Reset wizard state
    resetProcessing();

    sonnerToast.success('Arquivo(s) importado(s) com sucesso!');
  }, [refetchDocuments, refetchTree, resetProcessing]);

  // Handle closing import wizard
  const handleCancelImport = useCallback(() => {
    setMode('selection');
    setShowImportWizard(false);
    resetProcessing();
  }, [resetProcessing]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{mode === 'import' ? 'Importar Arquivos' : 'Selecionar Arquivo'}</span>
            <div className="flex items-center gap-2">
              {mode === 'selection' && (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setMode('import');
                      setShowImportWizard(true);
                    }}
                    disabled={!selectedNode}
                    title={!selectedNode ? 'Selecione um departamento ou pasta primeiro' : 'Importar arquivo'}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Importar Arquivo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  >
                    {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIncludeHidden(!includeHidden)}
                  >
                    {includeHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="ml-2">{includeHidden ? 'Ocultar arquivados' : 'Mostrar arquivados'}</span>
                  </Button>
                </>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <>
          {/* Content - Conditional based on mode */}
          {mode === 'import' ? (
          /* Import Wizard Mode */
          <ImportWizardProvider
            initialDepartmentId={selectedNode?.type === 'department' ? selectedNode.id : selectedNode?.department_id || ''}
            initialFolderId={selectedNode?.type === 'folder' ? selectedNode.id : ''}
          >
            <div className="flex-1 flex flex-col min-h-0 space-y-4">
              {/* Step Indicator */}
              <StepIndicator />

              {/* Wizard Step Content */}
              <div className="flex-1 overflow-auto">
                <WizardStepContent />
              </div>

              {/* Footer with Cancel button */}
              <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="outline" onClick={handleCancelImport}>
                  Cancelar Importação
                </Button>
              </div>
            </div>
          </ImportWizardProvider>
        ) : (
          /* Selection Mode (original tabs) */
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="browse" className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Navegar
              </TabsTrigger>
              <TabsTrigger value="recent" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recentes
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Favoritos
              </TabsTrigger>
              <TabsTrigger value="popular" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Populares
              </TabsTrigger>
            </TabsList>

            {/* Browse Tab */}
            <TabsContent value="browse" className="flex-1 flex flex-col min-h-0 space-y-4">
            {/* Breadcrumb and Filters */}
            <div className="space-y-4">
              <Breadcrumb items={breadcrumbs} onItemClick={handleBreadcrumbClick} />

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar documentos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setSearchQuery('')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo de arquivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="image">Imagens</SelectItem>
                    <SelectItem value="document">Documentos</SelectItem>
                    <SelectItem value="spreadsheet">Planilhas</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="processing">Processando</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>

                {(searchQuery || fileTypeFilter !== 'all' || statusFilter !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setFileTypeFilter('all');
                      setStatusFilter('all');
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpar filtros
                  </Button>
                )}
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-auto">
                {!selectedNode ? (
                  // Show folders grid when no folder selected
                  tree.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma pasta disponível</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {tree.map((node) => (
                        <FolderCard
                          key={node.id}
                          folder={{
                            id: node.id,
                            name: node.name,
                            type: node.type,
                            status: node.status || 'active',
                            documentCount: node.doc_count,
                            lastModified: new Date().toISOString(),
                            color: node.color,
                            icon: node.icon
                          }}
                          onClick={() => handleNodeSelect(node)}
                        />
                      ))}
                    </div>
                  )
                ) : (
                  // Show folder contents when folder selected
                  <div className="space-y-4">
                    {/* Subfolders */}
                    {currentFolders.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Pastas</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          {currentFolders.map((folder) => (
                            <FolderCard
                              key={folder.id}
                              folder={{
                                id: folder.id,
                                name: folder.name,
                                type: folder.type,
                                status: folder.status || 'active',
                                documentCount: folder.doc_count,
                                lastModified: new Date().toISOString(),
                                color: folder.color,
                                icon: folder.icon
                              }}
                              onClick={() => handleNodeSelect(folder)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents */}
                    {filteredDocuments.length === 0 ? (
                      <div className="flex items-center justify-center py-12 text-muted-foreground">
                        <div className="text-center">
                          <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhum documento encontrado</p>
                          {(searchQuery || fileTypeFilter !== 'all' || statusFilter !== 'all') && (
                            <p className="text-sm mt-2">Tente ajustar os filtros</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                          Documentos ({filteredDocuments.length})
                        </h3>
                        <div className={cn(
                          "gap-4",
                          viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "space-y-2"
                        )}>
                          {filteredDocuments.map(doc => renderDocumentCard(doc))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </div>
          </TabsContent>

          {/* Recent Tab */}
          <TabsContent value="recent" className="flex-1 overflow-auto">
            {renderQuickAccessSection(
              recentDocuments,
              <Clock className="h-12 w-12 opacity-50" />,
              "Documentos Recentes",
              "Você ainda não acessou nenhum documento"
            )}
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="flex-1 overflow-auto">
            {renderQuickAccessSection(
              favoriteDocuments,
              <Star className="h-12 w-12 opacity-50" />,
              "Documentos Favoritos",
              "Você ainda não possui documentos favoritos"
            )}
          </TabsContent>

          {/* Popular Tab */}
          <TabsContent value="popular" className="flex-1 overflow-auto">
            {renderQuickAccessSection(
              popularDocuments,
              <TrendingUp className="h-12 w-12 opacity-50" />,
              "Documentos Populares",
              "Nenhum documento popular no momento"
            )}
          </TabsContent>
        </Tabs>
        )}

          {/* Footer - only show in selection mode */}
          {mode === 'selection' && (
            <DialogFooter className="flex items-center justify-between">
              <div className="flex-1 text-sm text-muted-foreground">
                {allowMultiple ? (
                  tempSelectedDocuments.length > 0 && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="truncate">
                        {tempSelectedDocuments.length} arquivo{tempSelectedDocuments.length !== 1 ? 's' : ''} selecionado{tempSelectedDocuments.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )
                ) : (
                  tempSelectedDocumentName && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="truncate">Selecionado: {tempSelectedDocumentName}</span>
                    </div>
                  )
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmSelection}
                  disabled={allowMultiple ? tempSelectedDocuments.length === 0 : !tempSelectedDocumentId}
                >
                  {allowMultiple ? 'Confirmar Seleção' : 'Selecionar'}
                </Button>
              </div>
            </DialogFooter>
          )}
        </>
      </DialogContent>

      {/* Processing Progress Modal - shown during import */}
      <ProcessingProgressModal
        isOpen={isProcessing || isCompleted}
        steps={steps}
        logs={logs}
        isCompleted={isCompleted}
        hasErrors={hasErrors}
        canForceStop={canForceStop}
        onForceStop={async () => {
          console.log('🚨 Force stop requested');
          forceStop();
        }}
        onClose={async () => {
          console.log('🔄 Closing processing modal');
          if (isCompleted && !hasErrors) {
            // Import completed successfully
            await handleImportComplete();
          } else if (hasErrors) {
            // Import had errors, just close
            setMode('selection');
            setShowImportWizard(false);
          }
        }}
        onMinimize={() => {
          console.log('🔽 Minimizing processing modal');
          // Could implement minimize functionality if needed
        }}
      />
    </Dialog>
  );
};
