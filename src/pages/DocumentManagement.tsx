import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Search, Eye, EyeOff, FolderOpen, Folder, File, Plus, MoreHorizontal, ArrowLeft, ChevronLeft, ChevronRight, Bot } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DndContext, DragEndEvent, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import { useDocumentTree } from '@/hooks/useDocumentTree';
import { useDocumentActions } from '@/hooks/useDocumentActions';
import { useDocumentSearch } from '@/hooks/useDocumentSearch';
import { useFolderOperations } from '@/hooks/useFolderOperations';
import { useRecentDocuments } from '@/hooks/useRecentDocuments';
import { useFavoriteDocuments } from '@/hooks/useFavoriteDocuments';
import { usePopularDocuments } from '@/hooks/usePopularDocuments';
import { useDocumentAccess } from '@/hooks/useDocumentAccess';
import { supabase } from '@/integrations/supabase/client';

import { PDFViewerModal, PDFViewerSelectionModal } from '@/components/pdf-viewer';

import { FolderManagementModal } from '@/components/FolderManagementModal';
import { DocumentSearchModal } from '@/components/DocumentSearchModal';
import { DocumentList } from '@/components/DocumentList';
import { Breadcrumb } from '@/components/Breadcrumb';
import { FolderCard } from '@/components/FolderCard';
import { SearchBarEnhanced } from '@/components/SearchBarEnhanced';
import { QuickAccess } from '@/components/QuickAccess';

import { DocumentChatModal } from '@/components/rag/DocumentChatModal';
import { ProcessingIndicator } from '@/components/ProcessingIndicator';
import { ProcessingProgressModal } from '@/components/document-import/ProcessingProgressModal';
import { useProcessingStore } from '@/store/processingStore';
import { useDocumentHealthCheck } from '@/hooks/useDocumentHealthCheck';


export interface DocumentTreeItem {
  id: string;
  name: string;
  type: 'department' | 'folder';
  status?: 'active' | 'archived' | 'hidden';
  department_id?: string;
  parent_id?: string | null;
  doc_count: number;
  color?: string;
  children: DocumentTreeItem[];
  acl_hash?: string;
  has_custom_acl?: boolean;
}

export interface DocumentItem {
  id: string;
  name: string;
  status: 'aprovado' | 'pendente_revisao' | 'pendente_aprovacao' | 'rejeitado' | 'obsoleto' | 'processing' | 'active' | 'error' | 'archived' | 'hidden';
  processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
  mime_type?: string;
  file_size?: number;
  updated_at: string;
  version?: number;
  rag_capabilities?: {
    has_text_extraction?: boolean;
    has_ocr?: boolean;
    has_semantic?: boolean;
    text_chunks?: number;
    ocr_chunks?: number;
    semantic_chunks?: number;
    total_chunks?: number;
    processed_pages?: number;
    total_pages?: number;
    coverage_percentage?: number;
  };
  folder_id: string;
}

export interface BreadcrumbItem {
  id: string;
  name: string;
  type: 'department' | 'folder';
}

const DocumentManagement: React.FC = () => {
  const navigate = useNavigate();
  
  // Document health check functionality
  const { 
    isChecking,
    checkAndCleanStuckDocuments,
    reprocessStuckDocument
  } = useDocumentHealthCheck();
  
  // State management with local storage persistence
  const [selectedNode, setSelectedNode] = useState<DocumentTreeItem | null>(() => {
    const saved = localStorage.getItem('doc-mgmt-selected-node');
    return saved ? JSON.parse(saved) : null;
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('doc-mgmt-view-mode');
    return saved ? JSON.parse(saved) : 'grid';
  });
  const [showFolderManagement, setShowFolderManagement] = useState(false);
  const [showDocumentSearch, setShowDocumentSearch] = useState(false);
  const [includeHidden, setIncludeHidden] = useState(() => {
    const saved = localStorage.getItem('doc-mgmt-include-hidden');
    return saved ? JSON.parse(saved) : false;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchTab, setSearchTab] = useState<'folders' | 'files'>('folders');
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node?: DocumentTreeItem; document?: DocumentItem } | null>(null);
  const [searchFilters, setSearchFilters] = useState<{
    department?: string;
    status?: string;
    documentType?: string;
    dateRange?: { start: string; end: string };
  }>({});
  
  const [selectedDocumentForChat, setSelectedDocumentForChat] = useState<DocumentItem | null>(null);
  const [showDocumentChat, setShowDocumentChat] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  
  // PDF Viewer states
  const [showPDFViewerSelection, setShowPDFViewerSelection] = useState(false);
  const [selectedDocumentForView, setSelectedDocumentForView] = useState<DocumentItem | null>(null);
  const [currentPDFUrl, setCurrentPDFUrl] = useState<string>('');

  // Processing store
  const { 
    isProcessing, 
    isCompleted, 
    hasErrors, 
    steps, 
    logs, 
    canForceStop, 
    isMinimized,
    restore,
    minimize,
    forceStop: storeForceStop
  } = useProcessingStore();

  // Hooks
  const { tree, loading: treeLoading, refetch: refetchTree } = useDocumentTree({ includeHidden });
  const { documents, loading: docsLoading, refetch: refetchDocuments, downloadDocument, viewDocument, reprocessDocument, archiveDocument, deleteDocument, bulkAction } = useDocumentActions(selectedNode?.id);
  const { searchDocuments, loading: searchLoading } = useDocumentSearch();
  const { createSubfolder, renameFolder, moveFolder, archiveFolder, hideFolder, unhideFolder, deleteFolder } = useFolderOperations();
  
  // QuickAccess hooks
  const { recentDocuments, loading: recentLoading } = useRecentDocuments(5);
  const { favoriteDocuments, loading: favoritesLoading, toggleFavorite } = useFavoriteDocuments(5);
  const { popularDocuments, loading: popularLoading } = usePopularDocuments(5);
  const { logAccess } = useDocumentAccess();

  // OnlyOffice functions
  const visualizarOnlyOffice = async (documentId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const res = await fetch(`https://nahyrexnxhzutfeqxjte.supabase.co/functions/v1/view-doc?id=${documentId}&viewer=onlyoffice`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!res.ok) throw new Error("Falha ao obter config");
      const { config } = await res.json();
      openOnlyOffice(config);
    } catch (error) {
      console.error('Erro ao carregar OnlyOffice:', error);
      toast.error('Erro ao carregar OnlyOffice: ' + error.message);
    }
  };

  const openOnlyOffice = (config: any) => {
    const html = `<!doctype html>
<html><head>
  <meta charset="utf-8"/>
  <title>${config.document.title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <script src="https://office.aksell.com.br/web-apps/apps/api/documents/api.js"></script>
  <style>html,body,#placeholder{height:100%;width:100%;margin:0}</style>
</head><body>
  <div id="placeholder"></div>
  <script>
    const cfg = ${JSON.stringify(config)};
    if (typeof DocsAPI==='undefined') document.body.innerText='DocsAPI não carregou';
    else new DocsAPI.DocEditor('placeholder', cfg);
  <\/script>
</body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(()=>URL.revokeObjectURL(url), 30000);
  };

  // Handle folder query parameter for navigation from chat
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const folderId = params.get('folder');
    
    if (folderId && tree && tree.length > 0) {
      // Find and select the folder
      const findFolderInTree = (nodes: DocumentTreeItem[]): DocumentTreeItem | null => {
        for (const node of nodes) {
          if (node.id === folderId) return node;
          const found = findFolderInTree(node.children);
          if (found) return found;
        }
        return null;
      };
      
      const targetFolder = findFolderInTree(tree);
      if (targetFolder) {
        setSelectedNode(targetFolder);
        
        // Expand path to target folder
        const expandPath = (nodes: DocumentTreeItem[], targetId: string, path: string[] = []): string[] | null => {
          for (const node of nodes) {
            const currentPath = [...path, node.id];
            if (node.id === targetId) return currentPath;
            
            const childPath = expandPath(node.children, targetId, currentPath);
            if (childPath) return childPath;
          }
          return null;
        };
        
        const pathToTarget = expandPath(tree, folderId);
        // Path expansion no longer needed without tree
        
        // Clean URL
        window.history.replaceState({}, '', '/gestao/documentos');
      }
    }
  }, [tree]);

  // Drag and drop sensors
  const sensors = [
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  ];

  // Persist state changes
  useEffect(() => {
    localStorage.setItem('doc-mgmt-selected-node', JSON.stringify(selectedNode));
  }, [selectedNode]);

  useEffect(() => {
    localStorage.setItem('doc-mgmt-view-mode', JSON.stringify(viewMode));
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('doc-mgmt-include-hidden', JSON.stringify(includeHidden));
  }, [includeHidden]);

  // Sync local showProcessingModal with global isMinimized state
  useEffect(() => {
    if (isMinimized) {
      setShowProcessingModal(false);
    }
  }, [isMinimized]);

  // Get current folders (children of selected node) and documents
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

  const currentDocuments = documents || [];

  // Generate breadcrumb with "Gestão de Arquivos" prefix
  const breadcrumb = useMemo((): BreadcrumbItem[] => {
    const baseBreadcrumb: BreadcrumbItem[] = [{ id: 'root', name: 'Gestão de Arquivos', type: 'department' }];
    
    if (!selectedNode || !tree) return baseBreadcrumb;
    
    const findPath = (nodes: DocumentTreeItem[], targetId: string, path: BreadcrumbItem[] = []): BreadcrumbItem[] | null => {
      for (const node of nodes) {
        const currentPath = [...path, { id: node.id, name: node.name, type: node.type }];
        
        if (node.id === targetId) {
          return currentPath;
        }
        
        const childPath = findPath(node.children, targetId, currentPath);
        if (childPath) return childPath;
      }
      return null;
    };
    
    const nodePath = findPath(tree, selectedNode.id) || [];
    return [...baseBreadcrumb, ...nodePath];
  }, [selectedNode, tree]);

  // Event handlers
  const handleNodeSelect = useCallback((node: DocumentTreeItem) => {
    setSelectedNode(node);
    setSelectedDocuments(new Set());
  }, []);

  const handleNavigateToRoot = useCallback(() => {
    setSelectedNode(null);
    setSelectedDocuments(new Set());
  }, []);

  const handleFolderCardClick = useCallback((folder: DocumentTreeItem) => {
    handleNodeSelect(folder);
  }, [handleNodeSelect]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    try {
      // TODO: Implement drag and drop logic
      // Move folder to new parent or reorder siblings
      await refetchTree();
      toast.success('Pasta movida com sucesso');
    } catch (error) {
      console.error('Erro ao mover pasta:', error);
      toast.error('Erro ao mover pasta');
    }
  }, [refetchTree]);


  const handleDocumentAction = useCallback(async (action: string, documentId: string | string[]) => {
    try {
      const docIds = Array.isArray(documentId) ? documentId : [documentId];
      
      switch (action) {
        case 'download':
          if (typeof documentId === 'string') {
            await downloadDocument(documentId);
          }
          break;
        case 'reprocess':
          if (typeof documentId === 'string') {
            await reprocessDocument(documentId);
          } else {
            await bulkAction(documentId, 'reprocess');
          }
          break;
        case 'archive':
          if (typeof documentId === 'string') {
            await archiveDocument(documentId);
          } else {
            await bulkAction(documentId, 'archive');
          }
          break;
        case 'delete':
          if (typeof documentId === 'string') {
            await deleteDocument(documentId);
          }
          break;
        case 'chat':
          if (typeof documentId === 'string') {
            const document = documents?.find(d => d.id === documentId);
            if (document) {
              setSelectedDocumentForChat(document);
              setShowDocumentChat(true);
            }
          }
          break;
        case 'view':
          if (typeof documentId === 'string') {
            const document = documents?.find(d => d.id === documentId);
            if (document) {
              try {
                // Log the document access
                await logAccess(documentId, document.folder_id, 'view');
                
                // Check if it's an Office document
                const officeTypes = [
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                  'application/msword',
                  'application/vnd.ms-excel',
                  'application/vnd.ms-powerpoint',
                  'application/vnd.oasis.opendocument.text',
                  'application/vnd.oasis.opendocument.spreadsheet',
                  'application/vnd.oasis.opendocument.presentation'
                ];

                if (officeTypes.includes(document.mime_type || '')) {
                  // Office documents: open with fetch+blob pattern
                  await visualizarOnlyOffice(documentId);
                  
                } else if (document.mime_type === 'application/pdf') {
                  // PDFs: show selection modal for viewer type
                  const url = await viewDocument(documentId);
                  if (url) {
                    setSelectedDocumentForView(document);
                    setCurrentPDFUrl(url);
                    setShowPDFViewerSelection(true);
                  }
                }
              } catch (error) {
                console.error('Erro ao visualizar documento:', error);
                toast.error('Erro ao visualizar documento');
              }
            }
          }
          break;
      }
      await refetchDocuments();
    } catch (error: any) {
      console.error(`Erro na ação ${action}:`, error);
      toast.error(error.message || `Erro na ação ${action}`);
    }
  }, [downloadDocument, viewDocument, reprocessDocument, archiveDocument, bulkAction, refetchDocuments, documents, logAccess]);

  const handleQuickAccessClick = useCallback(async (item: any) => {
    // Log access for quick access items
    if (item.id && item.path) {
      await logAccess(item.id, item.path, 'view');
    }
    
    // Navigate to the document or open it
    toast.success(`Abrindo: ${item.name}`);
  }, [logAccess]);

  const handleToggleFavorite = useCallback(async (itemId: string) => {
    // Find the item and toggle favorite
    await toggleFavorite(itemId, selectedNode?.id || '');
  }, [toggleFavorite, selectedNode]);

  const handleBreadcrumbClick = useCallback((item: BreadcrumbItem) => {
    if (item.id === 'root') {
      handleNavigateToRoot();
      return;
    }
    
    const findNode = (nodes: DocumentTreeItem[]): DocumentTreeItem | null => {
      for (const node of nodes) {
        if (node.id === item.id) return node;
        const found = findNode(node.children);
        if (found) return found;
      }
      return null;
    };
    
    if (tree) {
      const node = findNode(tree);
      if (node) {
        setSelectedNode(node);
      }
    }
  }, [tree, handleNavigateToRoot]);

  const handleSearch = useCallback(async (query: string, filters?: any) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowDocumentSearch(false);
      return;
    }
    
    try {
      const results = await searchDocuments({
        query,
        departmentId: filters?.department,
        includeArchived: includeHidden || filters?.status === 'archived',
        includeHidden: includeHidden || filters?.status === 'hidden'
      });
      
      setSearchResults(results);
      setShowDocumentSearch(true);
    } catch (error) {
      console.error('Erro na busca:', error);
      toast.error('Erro na busca');
    }
  }, [searchDocuments, includeHidden]);

  const handleSearchResultClick = useCallback((result: any) => {
    // Navigate to the result and focus on it
    setShowDocumentSearch(false);
    // TODO: Implement navigation to result
    toast.success(`Navegando para: ${result.filename}`);
  }, []);

  const handleCreateFolder = useCallback(async (name: string) => {
    if (!selectedNode) return;
    
    try {
      const departmentId = selectedNode.type === 'department' ? selectedNode.id : selectedNode.department_id;
      const parentId = selectedNode.type === 'folder' ? selectedNode.id : undefined;
      
      await createSubfolder(name, departmentId!, parentId);
      await refetchTree();
      toast.success('Pasta criada com sucesso');
    } catch (error: any) {
      console.error('Erro ao criar pasta:', error);
      toast.error(error.message || 'Erro ao criar pasta');
    }
  }, [selectedNode, createSubfolder, refetchTree]);

  const handleFolderAction = useCallback(async (action: string, folderId: string, data?: any) => {
    try {
      switch (action) {
        case 'create':
          await handleCreateFolder(data.name);
          break;
        case 'rename':
          await renameFolder(folderId, data.name);
          toast.success('Pasta renomeada com sucesso');
          break;
        case 'move':
          await moveFolder(folderId, data.parentId);
          toast.success('Pasta movida com sucesso');
          break;
        case 'archive':
          await archiveFolder(folderId);
          toast.success('Pasta arquivada com sucesso');
          break;
        case 'hide':
          await hideFolder(folderId);
          toast.success('Pasta ocultada com sucesso');
          break;
        case 'unhide':
          await unhideFolder(folderId);
          toast.success('Pasta reexibida com sucesso');
          break;
        case 'delete':
          // Check if folder has content before deletion
          const folderToDelete = currentFolders.find(f => f.id === folderId);
          if (folderToDelete && folderToDelete.doc_count > 0) {
            toast.error('Não é possível excluir pastas que contenham itens. Arquive ou mova o conteúdo antes.');
            return;
          }
          await deleteFolder(folderId);
          toast.success('Pasta excluída com sucesso');
          break;
      }
      await refetchTree();
    } catch (error: any) {
      console.error(`Erro na ação ${action}:`, error);
      toast.error(error.message || `Erro na ação ${action}`);
    }
  }, [currentFolders, handleCreateFolder, renameFolder, moveFolder, archiveFolder, hideFolder, unhideFolder, deleteFolder, refetchTree]);

  // PDF Viewer handlers
  const handleClosePDFViewerSelection = useCallback(() => {
    setShowPDFViewerSelection(false);
    setSelectedDocumentForView(null);
    setCurrentPDFUrl('');
  }, []);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      setShowDocumentSearch(true);
    }
    if (e.key === 'Escape') {
      setSelectedDocuments(new Set());
      setContextMenu(null);
    }
    if (e.key === 'Delete' && selectedDocuments.size > 0) {
      handleDocumentAction('archive', [...selectedDocuments]);
    }
    if (e.key === 'Enter' && selectedDocuments.size === 1) {
      const [docId] = selectedDocuments;
      handleDocumentAction('download', docId);
    }
  }, [selectedDocuments, handleDocumentAction]);

  // Click outside to close context menu
  const handleGlobalClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [handleKeyDown, handleGlobalClick]);

  const currentDepartment = selectedNode?.type === 'department' ? selectedNode : 
    breadcrumb.find(item => item.type === 'department');

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="h-16 shrink-0 border-b bg-background px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (!selectedNode) {
                // Se está na raiz, voltar para tasks
                navigate('/tasks');
              } else {
                // Se está em uma pasta/departamento, voltar um nível
                const parentItem = breadcrumb[breadcrumb.length - 2];
                if (parentItem) {
                  handleBreadcrumbClick(parentItem);
                } else {
                  handleNavigateToRoot();
                }
              }
            }}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="w-96 max-w-full">
            <SearchBarEnhanced
              onSearch={handleSearch}
              onFilterChange={(filters) => {
                setSearchFilters({
                  department: filters.departments?.[0],
                  status: filters.status?.[0],
                  documentType: filters.documentTypes?.[0],
                  dateRange: filters.dateRange ? {
                    start: filters.dateRange.from?.toISOString() || '',
                    end: filters.dateRange.to?.toISOString() || ''
                  } : undefined
                });
              }}
              departments={tree || []}
              recentSearches={[]}
              placeholder="Buscar arquivos..."
            />
          </div>
          
          <ProcessingIndicator 
            onOpenModal={() => {
              restore();
              setShowProcessingModal(true);
            }} 
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedDocumentForChat(null);
              setShowDocumentChat(true);
            }}
          >
            <Bot className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Perguntar à IA</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIncludeHidden(!includeHidden)}
          >
            {includeHidden ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            <span className="hidden sm:inline">{includeHidden ? "Ocultar" : "Incluir"}</span>
          </Button>

          <Button
            variant="ghost" 
            size="icon"
            onClick={() => setShowFolderManagement(true)}
            disabled={!currentDepartment}
            title="Configurar pastas"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content Area - Full Width */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content Header */}
        <div className="p-4 border-b bg-background">
          {/* Breadcrumb */}
          <Breadcrumb items={breadcrumb} onItemClick={handleBreadcrumbClick} />
          
          <div className="flex items-center justify-between mt-3">
            <h3 className="text-lg font-semibold">
              {selectedNode ? selectedNode.name : 'Gestão de Arquivos'}
            </h3>
              
            <div className="flex items-center gap-2">
              {selectedNode && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const name = prompt('Nome da nova pasta:');
                      if (name) {
                        handleCreateFolder(name);
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Pasta
                  </Button>
                  
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      if (!selectedNode) return;
                      const params = new URLSearchParams();
                      if (selectedNode.type === 'folder') {
                        params.set('folder', selectedNode.id);
                        params.set('department', selectedNode.department_id || '');
                      } else if (selectedNode.type === 'department') {
                        params.set('department', selectedNode.id);
                      }
                      navigate(`/gestao/documentos/importar?${params.toString()}`);
                    }}
                    disabled={!selectedNode}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Importar Arquivo
                  </Button>
                </>
              )}
                
              {selectedDocuments.size > 0 && (
                <>
                  <Badge variant="secondary" className="px-3">
                    {selectedDocuments.size} selecionado(s)
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDocumentAction('archive', [...selectedDocuments])}
                  >
                    Arquivar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDocumentAction('reprocess', [...selectedDocuments])}
                  >
                    Reprocessar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-4">
          {selectedNode ? (
            <div className="space-y-6">
              {/* Quick Access at folder level */}
              {selectedNode.type === 'department' && (
                <QuickAccess
                  recentItems={[]}
                  favoriteItems={[]}
                  popularItems={[]}
                  onItemClick={(item) => {
                    // TODO: Navigate to item
                  }}
                  onToggleFavorite={(item) => {
                    // TODO: Toggle favorite
                  }}
                />
              )}

              {/* Subfolders Cards */}
              {currentFolders.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Pastas</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {currentFolders.map(folder => (
                      <FolderCard
                        key={folder.id}
                        folder={{
                          id: folder.id,
                          name: folder.name,
                          type: folder.type,
                          status: folder.status || 'active',
                          documentCount: folder.doc_count,
                          lastModified: new Date().toISOString()
                        }}
                        onClick={() => handleFolderCardClick(folder)}
                        variant={viewMode === 'grid' ? 'default' : 'compact'}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              <div>
                {currentDocuments.length > 0 && (
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Arquivos</h4>
                )}
                <DocumentList
                  documents={currentDocuments}
                  loading={docsLoading}
                  selectedDocuments={selectedDocuments}
                  onSelectionChange={setSelectedDocuments}
                  onDocumentAction={handleDocumentAction}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Quick Access for root level */}
              <QuickAccess
                recentItems={recentDocuments}
                favoriteItems={favoriteDocuments}
                popularItems={popularDocuments}
                onItemClick={handleQuickAccessClick}
                onToggleFavorite={handleToggleFavorite}
              />

              {/* Department Cards */}
              {treeLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : tree && tree.length > 0 ? (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Departamentos</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {tree.map(department => (
                      <FolderCard
                        key={department.id}
                        folder={{
                          id: department.id,
                          name: department.name,
                          type: department.type,
                          status: department.status || 'active',
                          documentCount: department.doc_count,
                          lastModified: new Date().toISOString()
                        }}
                        onClick={() => handleFolderCardClick(department)}
                        variant={viewMode === 'grid' ? 'default' : 'compact'}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Nenhum departamento encontrado</h3>
                    <p className="text-sm">Configure departamentos no sistema para começar</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-popover border rounded-md shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.node && (
            <>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => {
                  const name = prompt('Novo nome:', contextMenu.node?.name);
                  if (name && contextMenu.node) {
                    handleFolderAction('rename', contextMenu.node.id, { name });
                  }
                  setContextMenu(null);
                }}
              >
                Renomear
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => {
                  if (contextMenu.node) {
                    handleFolderAction('archive', contextMenu.node.id);
                  }
                  setContextMenu(null);
                }}
              >
                Arquivar
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => {
                  if (contextMenu.node) {
                    handleFolderAction('hide', contextMenu.node.id);
                  }
                  setContextMenu(null);
                }}
              >
                Ocultar
              </button>
              {contextMenu.node && contextMenu.node.doc_count === 0 && (
                <button
                  className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-accent"
                  onClick={() => {
                    if (contextMenu.node && confirm(`Tem certeza que deseja excluir a pasta "${contextMenu.node.name}"?`)) {
                      handleFolderAction('delete', contextMenu.node.id);
                    }
                    setContextMenu(null);
                  }}
                >
                  Excluir
                </button>
              )}
            </>
          )}
          {contextMenu.document && (
            <>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => {
                  if (contextMenu.document) {
                    setSelectedDocumentForChat(contextMenu.document);
                    setShowDocumentChat(true);
                  }
                  setContextMenu(null);
                }}
              >
                <Bot className="h-4 w-4 mr-2 inline" />
                Perguntar sobre este documento
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => {
                  if (contextMenu.document) {
                    handleDocumentAction('download', contextMenu.document.id);
                  }
                  setContextMenu(null);
                }}
              >
                Download
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => {
                  if (contextMenu.document) {
                    handleDocumentAction('reprocess', contextMenu.document.id);
                  }
                  setContextMenu(null);
                }}
              >
                Reprocessar
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => {
                  if (contextMenu.document) {
                    handleDocumentAction('archive', contextMenu.document.id);
                  }
                  setContextMenu(null);
                }}
              >
                Arquivar
              </button>
            </>
          )}
        </div>
      )}

      {/* Modals */}
      {currentDepartment && (
        <FolderManagementModal
          open={showFolderManagement}
          onClose={() => setShowFolderManagement(false)}
          departmentId={currentDepartment.id}
          departmentName={currentDepartment.name}
        />
      )}

      <DocumentSearchModal
        open={showDocumentSearch}
        onOpenChange={setShowDocumentSearch}
        onSearch={handleSearch}
        searchResults={searchResults}
        searchTab={searchTab}
        onSearchTabChange={setSearchTab}
        onResultClick={handleSearchResultClick}
        includeHidden={includeHidden}
      />


      {/* Processing Progress Modal - FIXED: Consider isMinimized state */}
      <ProcessingProgressModal
        isOpen={(isProcessing || showProcessingModal) && !isMinimized}
        steps={steps}
        logs={logs}
        isCompleted={isCompleted}
        hasErrors={hasErrors}
        canForceStop={canForceStop}
        onForceStop={async () => {
          console.log('🚨 Force stop requested from DocumentManagement');
          
          // First, stop the processing in the store
          storeForceStop();
          
          try {
            // Then clean up any stuck documents
            const result = await reprocessStuckDocument();
            if (result) {
              toast.success('Processamento forçado a parar e documentos travados foram corrigidos');
            } else {
              toast.info('Processamento parado - nenhum documento travado encontrado');
            }
          } catch (error) {
            console.error('Error cleaning up stuck documents:', error);
            toast.error('Processamento parado, mas erro ao limpar documentos travados');
          }
          
          // Close modal after force stop
          setShowProcessingModal(false);
        }}
        onClose={() => {
          console.log('🔄 Closing processing modal from DocumentManagement');
          setShowProcessingModal(false);
        }}
        onMinimize={() => {
          console.log('🔽 Minimizing processing modal from DocumentManagement');
          minimize();
        }}
      />

      {/* PDF Viewer Selection Modal */}
      <PDFViewerSelectionModal
        isOpen={showPDFViewerSelection}
        onClose={handleClosePDFViewerSelection}
        documentName={selectedDocumentForView?.name || ''}
        signedUrl={currentPDFUrl}
        documentId={selectedDocumentForView?.id || ''}
      />

      {/* Document Chat Modal */}
      <DocumentChatModal
        open={showDocumentChat}
        onOpenChange={setShowDocumentChat}
        document={selectedDocumentForChat ? {
          id: selectedDocumentForChat.id,
          name: selectedDocumentForChat.name,
          folder_id: selectedDocumentForChat.folder_id
        } : { id: '', name: '', folder_id: '' }}
        folderName={selectedNode?.type === 'folder' ? selectedNode.name : undefined}
        availableDocuments={documents}
      />
    </div>
  );
};

export default DocumentManagement;