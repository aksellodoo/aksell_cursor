import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Edit, 
  Move, 
  Archive, 
  EyeOff, 
  Merge, 
  MoreHorizontal,
  Lock,
  ChevronRight,
  ChevronDown,
  GripVertical,
  Trash2,
  FolderOpen,
  Folder,
  FileText
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useDepartmentFolders } from "@/hooks/useDepartmentFolders";

interface FolderItem {
  id: string;
  name: string;
  slug?: string;
  status: 'active' | 'archived' | 'hidden';
  parent_id?: string | null;
  parent_folder_id?: string | null;
  order_index?: number;
  acl?: any;
  path_cache?: string | null;
  doc_count: number;
  descendant_count?: number;
  updated_at: string;
  allow_delete: boolean;
  children?: FolderItem[];
}

interface FolderManagementModalProps {
  open: boolean;
  onClose: () => void;
  departmentId: string | null;
  departmentName: string;
}

export const FolderManagementModal = ({ 
  open, 
  onClose, 
  departmentId, 
  departmentName 
}: FolderManagementModalProps) => {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState<FolderItem[]>([]);
  const { toast } = useToast();

  const { refetch, createFolder, updateFolder, deleteFolder: deleteFolderHook } = useDepartmentFolders(departmentId);

  const renameFolder = async (folderId: string, newName: string) => {
    try {
      await updateFolder(folderId, { name: newName });
      toast({
        title: "Pasta renomeada",
        description: "A pasta foi renomeada com sucesso.",
      });
      fetchFoldersHierarchy();
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao renomear pasta",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteFolder = async (folderId: string, allowDelete: boolean) => {
    // Check if folder is protected from deletion
    if (!allowDelete) {
      toast({
        title: "Pasta protegida",
        description: "Esta pasta está protegida contra exclusão. Edite as configurações da pasta para permitir exclusão.",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteFolderHook(folderId);
      toast({
        title: "Pasta excluída",
        description: "A pasta foi excluída com sucesso.",
      });
      fetchFoldersHierarchy();
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir pasta",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createNewFolder = async (name: string) => {
    try {
      await createFolder(name);
      toast({
        title: "Pasta criada",
        description: "A pasta foi criada com sucesso.",
      });
      fetchFoldersHierarchy();
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao criar pasta",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (open && departmentId) {
      fetchFoldersHierarchy();
    }
  }, [open, departmentId]);

  const fetchFoldersHierarchy = async () => {
    if (!departmentId) return;
    
    setLoading(true);
    try {
      // Buscar todas as pastas com contagens usando a view existente
      const { data: foldersData, error } = await supabase
        .from('folders')
        .select(`
          id, name, status, parent_folder_id, updated_at, allow_delete,
          folder_document_counts(doc_count)
        `)
        .eq('department_id', departmentId)
        .order('parent_folder_id', { nullsFirst: true })
        .order('name', { ascending: true });

      if (error) throw error;

      // Mapear dados
      const folderMap = new Map<string, FolderItem>();

      foldersData?.forEach(folder => {
        folderMap.set(folder.id, {
          ...folder,
          slug: folder.name.toLowerCase().replace(/[^a-z0-9]/g, '-'), // Generate slug from name
          parent_id: folder.parent_folder_id,
          order_index: 0,
          doc_count: folder.folder_document_counts?.[0]?.doc_count || 0,
          descendant_count: folder.folder_document_counts?.[0]?.doc_count || 0,
          children: []
        });
      });

      // Construir árvore
      const rootFolders: FolderItem[] = [];
      folderMap.forEach(folder => {
        if (folder.parent_id) {
          const parent = folderMap.get(folder.parent_id);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(folder);
          }
        } else {
          rootFolders.push(folder);
        }
      });

      setFolders(rootFolders);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar pastas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const toggleSelected = (folderId: string) => {
    setSelectedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Ativo</Badge>;
      case 'archived':
        return <Badge variant="secondary">Arquivado</Badge>;
      case 'hidden':
        return <Badge variant="outline">Oculto</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const archiveFolder = async (folderId: string) => {
    try {
      const { error } = await supabase
        .from('folders')
        .update({ status: 'archived' as any })
        .eq('id', folderId);
      
      if (error) throw error;
      
      toast({
        title: "Pasta arquivada",
        description: "A pasta foi arquivada com sucesso.",
      });
      
      fetchFoldersHierarchy();
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao arquivar pasta",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const hideFolder = async (folderId: string) => {
    try {
      const { error } = await supabase
        .from('folders')
        .update({ status: 'hidden' as any })
        .eq('id', folderId);
      
      if (error) throw error;
      
      toast({
        title: "Pasta ocultada",
        description: "A pasta foi ocultada com sucesso.",
      });
      
      fetchFoldersHierarchy();
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao ocultar pasta",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const renderFolder = (folder: FolderItem, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolders.has(folder.id);
    const hasChildren = folder.children && folder.children.length > 0;
    const hasAcl = folder.acl && Object.keys(folder.acl).length > 0;

    if (searchTerm && !folder.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !(folder.slug && folder.slug.toLowerCase().includes(searchTerm.toLowerCase()))) {
      return null;
    }

    return (
      <div key={folder.id} className="border-b border-border/50">
        <div 
          className={`flex items-center gap-2 p-2 hover:bg-muted/50 ${
            isSelected ? 'bg-accent' : ''
          }`}
          style={{ paddingLeft: `${8 + level * 20}px` }}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => toggleSelected(folder.id)}
          />
          
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
          
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => toggleExpanded(folder.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div className="w-6" />
          )}

          <div className="flex items-center gap-1">
            {folder.status === 'active' ? (
              <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 text-muted-foreground" />
            )}
            {hasAcl && <Lock className="h-3 w-3 text-amber-500" />}
            {!folder.allow_delete && <Lock className="h-3 w-3 text-red-500" title="Protegida contra exclusão" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{folder.name}</span>
              {folder.slug && <span className="text-sm text-muted-foreground">({folder.slug})</span>}
              {getStatusBadge(folder.status)}
              {!folder.allow_delete && (
                <Badge variant="destructive" className="text-xs">
                  Protegida
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {folder.doc_count} arquivos
              </span>
              {folder.descendant_count && folder.descendant_count > folder.doc_count && (
                <span>+{folder.descendant_count - folder.doc_count} em subpastas</span>
              )}
              <span>Atualizado: {new Date(folder.updated_at).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                const newName = prompt('Novo nome da pasta:', folder.name);
                if (newName && newName !== folder.name) {
                  renameFolder(folder.id, newName);
                }
              }}>
                <Edit className="mr-2 h-4 w-4" />
                Renomear
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                // TODO: Implement move dialog
                toast({
                  title: "Funcionalidade em desenvolvimento",
                  description: "A função de mover pastas será implementada em breve.",
                });
              }}>
                <Move className="mr-2 h-4 w-4" />
                Mover
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => archiveFolder(folder.id)}>
                <Archive className="mr-2 h-4 w-4" />
                Arquivar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => hideFolder(folder.id)}>
                <EyeOff className="mr-2 h-4 w-4" />
                Ocultar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                // TODO: Implement merge dialog
                toast({
                  title: "Funcionalidade em desenvolvimento",
                  description: "A função de mesclar pastas será implementada em breve.",
                });
              }}>
                <Merge className="mr-2 h-4 w-4" />
                Mesclar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={async () => {
                const newAllowDelete = !folder.allow_delete;
                try {
                  const { error } = await supabase
                    .from('folders')
                    .update({ allow_delete: newAllowDelete })
                    .eq('id', folder.id);

                  if (error) throw error;

                  toast({
                    title: newAllowDelete ? "Proteção removida" : "Pasta protegida",
                    description: newAllowDelete
                      ? "A pasta agora pode ser excluída."
                      : "A pasta está protegida contra exclusão.",
                  });

                  fetchFoldersHierarchy();
                  refetch();
                } catch (error: any) {
                  toast({
                    title: "Erro ao atualizar pasta",
                    description: error.message,
                    variant: "destructive",
                  });
                }
              }}>
                <Lock className="mr-2 h-4 w-4" />
                {folder.allow_delete ? 'Proteger contra exclusão' : 'Remover proteção'}
              </DropdownMenuItem>
              {folder.doc_count === 0 && (!folder.children || folder.children.length === 0) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    disabled={!folder.allow_delete}
                    onClick={() => {
                      if (confirm(`Tem certeza que deseja excluir a pasta "${folder.name}"?`)) {
                        deleteFolder(folder.id, folder.allow_delete);
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir {!folder.allow_delete && '(Protegida)'}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {folder.children?.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredFolders = folders.filter(folder => {
    if (!searchTerm) return true;
    return folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (folder.slug && folder.slug.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Gerenciar Subpastas - {departmentName}
          </DialogTitle>
        </DialogHeader>

        {/* Breadcrumb */}
        {breadcrumb.length > 0 && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground border-b pb-2">
            <span>Pasta atual:</span>
            {breadcrumb.map((item, index) => (
              <div key={item.id} className="flex items-center">
                {index > 0 && <ChevronRight className="h-3 w-3 mx-1" />}
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pastas... (Ctrl+K)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {selectedFolders.size > 0 && (
              <Badge variant="secondary">
                {selectedFolders.size} selecionada{selectedFolders.size > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const name = prompt('Nome da nova pasta:');
                if (name && departmentId) {
                  createNewFolder(name);
                }
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Pasta
            </Button>
            
            {selectedFolders.size > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Ações em Lote
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <Archive className="mr-2 h-4 w-4" />
                    Arquivar Selecionadas
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Ocultar Selecionadas
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Move className="mr-2 h-4 w-4" />
                    Mover Selecionadas
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Folder Tree */}
        <div className="flex-1 overflow-auto border rounded-md">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Carregando pastas...
            </div>
          ) : filteredFolders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchTerm ? "Nenhuma pasta encontrada para a busca." : "Nenhuma pasta encontrada."}
            </div>
          ) : (
            <div>
              {filteredFolders.map(folder => renderFolder(folder))}
            </div>
          )}
        </div>

        {/* Tooltips Info */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <div><strong>Arquivar:</strong> Torna a pasta somente leitura, sem uploads</div>
          <div><strong>Ocultar:</strong> Remove da interface padrão, mantém no sistema</div>
          <div><strong>Mesclar:</strong> Move todos os arquivos para outra pasta e remove a origem</div>
          <div><strong>Atalhos:</strong> Enter para salvar, Esc para fechar, Ctrl+K para buscar</div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
