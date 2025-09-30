import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateColorFromName } from "@/utils/colorUtils";
import { Palette, Plus, Trash2, FolderOpen, FileText, Settings } from "lucide-react";
import { useDepartmentFolders } from "@/hooks/useDepartmentFolders";
import { FolderManagementModal } from "./FolderManagementModal";

interface Department {
  id: string;
  name: string;
  description: string | null;
  color: string;
  integrates_org_chart: boolean;
  document_root_enabled: boolean;
  document_root_folder_id: string | null;
}

interface DepartmentFormModalProps {
  open: boolean;
  onClose: () => void;
  department?: Department | null;
}

interface SubfolderItem {
  id?: string;
  name: string;
  isNew?: boolean;
}

export const DepartmentFormModal = ({ open, onClose, department }: DepartmentFormModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
    integrates_org_chart: false,
    document_root_enabled: false,
  });
  const [subfolders, setSubfolders] = useState<SubfolderItem[]>([]);
  const [newSubfolderName, setNewSubfolderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [userChangedColor, setUserChangedColor] = useState(false);
  const [showFolderManagement, setShowFolderManagement] = useState(false);
  const { toast } = useToast();
  
  const { folders, loading: foldersLoading, createFolder, deleteFolder } = useDepartmentFolders(
    department?.id || null
  );

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
        description: department.description || "",
        color: department.color,
        integrates_org_chart: department.integrates_org_chart,
        document_root_enabled: department.document_root_enabled,
      });
      setUserChangedColor(true);
      
      // Carregar subpastas existentes (excluindo a pasta raiz)
      const existingSubfolders = folders
        .filter(folder => !folder.is_root)
        .map(folder => ({
          id: folder.id,
          name: folder.name,
          isNew: false
        }));
      setSubfolders(existingSubfolders);
    } else {
      setFormData({
        name: "",
        description: "",
        color: "#3B82F6",
        integrates_org_chart: false,
        document_root_enabled: false,
      });
      setUserChangedColor(false);
      setSubfolders([]);
    }
    setNewSubfolderName("");
  }, [department, open, folders]);

  // Auto-suggest color based on department name
  useEffect(() => {
    if (!userChangedColor && formData.name.trim()) {
      const suggestedColor = generateColorFromName(formData.name);
      setFormData(prev => ({ ...prev, color: suggestedColor }));
    }
  }, [formData.name, userChangedColor]);

  const handleColorChange = (newColor: string) => {
    setFormData({ ...formData, color: newColor });
    setUserChangedColor(true);
  };

  const handleSuggestColor = () => {
    if (formData.name.trim()) {
      const suggestedColor = generateColorFromName(formData.name);
      setFormData({ ...formData, color: suggestedColor });
      setUserChangedColor(false);
    }
  };

  const addSubfolder = () => {
    if (newSubfolderName.trim()) {
      setSubfolders(prev => [...prev, { 
        name: newSubfolderName.trim(), 
        isNew: true 
      }]);
      setNewSubfolderName("");
    }
  };

  const removeSubfolder = async (index: number) => {
    const subfolder = subfolders[index];
    
    if (subfolder.id && !subfolder.isNew) {
      // Pasta existente - deletar do banco
      try {
        await deleteFolder(subfolder.id);
        toast({
          title: "Subpasta removida",
          description: "A subpasta foi removida com sucesso.",
        });
      } catch (error: any) {
        toast({
          title: "Erro ao remover subpasta",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
    }
    
    // Remover da lista local
    setSubfolders(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let departmentId = department?.id;
      
      if (department) {
        // Update existing department
        const { error } = await supabase
          .from("departments")
          .update(formData)
          .eq("id", department.id);

        if (error) throw error;
      } else {
        // Create new department
        const { data: newDept, error } = await supabase
          .from("departments")
          .insert([formData])
          .select()
          .single();

        if (error) throw error;
        departmentId = newDept.id;
      }

      // Se gestão de documentos está habilitada, criar pastas
      if (formData.document_root_enabled && departmentId) {
        // Criar pasta raiz se não existir
        const rootFolder = folders.find(f => f.is_root);
        let rootFolderId = rootFolder?.id;
        
        if (!rootFolder) {
          const newRootFolder = await createFolder(`Documentos - ${formData.name}`, true);
          rootFolderId = newRootFolder?.id;
          
          // Atualizar o departamento com o ID da pasta raiz
          if (rootFolderId) {
            await supabase
              .from("departments")
              .update({ document_root_folder_id: rootFolderId })
              .eq("id", departmentId);
          }
        }

        // Criar novas subpastas
        for (const subfolder of subfolders) {
          if (subfolder.isNew) {
            await createFolder(subfolder.name, false, rootFolderId);
          }
        }
      }

      toast({
        title: department ? "Departamento atualizado" : "Departamento criado",
        description: `O departamento foi ${department ? "atualizado" : "criado"} com sucesso.`,
      });

      onClose();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar departamento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const rootFolder = folders.find(f => f.is_root);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {department ? "Editar Departamento" : "Novo Departamento"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Departamento</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="color">Cor do Departamento</Label>
              {!department && (
                <p className="text-sm text-muted-foreground mb-2">
                  A cor é sugerida automaticamente baseada no nome do departamento
                </p>
              )}
              <div className="flex items-center space-x-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSuggestColor}
                  disabled={!formData.name.trim()}
                  className="flex items-center space-x-1"
                >
                  <Palette className="h-4 w-4" />
                  <span>Sugerir</span>
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="integrates_org_chart"
                checked={formData.integrates_org_chart}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, integrates_org_chart: checked as boolean })
                }
              />
              <Label htmlFor="integrates_org_chart">Integra Organograma</Label>
            </div>

            {/* Gestão de Documentos */}
            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="document_root_enabled"
                  checked={formData.document_root_enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, document_root_enabled: checked as boolean })
                  }
                />
                <Label htmlFor="document_root_enabled" className="font-medium">
                  Ativar pasta de Gestão de Documentos para este departamento
                </Label>
              </div>

              {formData.document_root_enabled && (
                <div className="space-y-4 pl-4 border-l-2 border-muted">
                  {/* Status da pasta raiz */}
                  {department && rootFolder && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FolderOpen className="h-4 w-4 text-primary" />
                        <span className="font-medium">{rootFolder.name}</span>
                        <Badge variant="secondary">
                          <FileText className="h-3 w-3 mr-1" />
                          {rootFolder.doc_count || 0} arquivos
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFolderManagement(true)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Gerenciar Subpastas
                      </Button>
                    </div>
                  )}

                  {/* Subpastas */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">Subpastas</Label>
                      {department && formData.document_root_enabled && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowFolderManagement(true)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Gerenciar Subpastas
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Configure as subpastas padrão para organizar os arquivos
                    </p>
                    
                    {/* Lista de subpastas */}
                    <div className="space-y-2 mb-3">
                      {subfolders.map((subfolder, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{subfolder.name}</span>
                            {subfolder.isNew && (
                              <Badge variant="outline" className="text-xs">Nova</Badge>
                            )}
                            {!subfolder.isNew && subfolder.id && (
                              <Badge variant="secondary" className="text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                {folders.find(f => f.id === subfolder.id)?.doc_count || 0}
                              </Badge>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSubfolder(index)}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Adicionar nova subpasta */}
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Nome da subpasta"
                        value={newSubfolderName}
                        onChange={(e) => setNewSubfolderName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSubfolder()}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addSubfolder}
                        disabled={!newSubfolderName.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || foldersLoading}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Gerenciamento de Subpastas */}
      <FolderManagementModal
        open={showFolderManagement}
        onClose={() => setShowFolderManagement(false)}
        departmentId={department?.id || null}
        departmentName={formData.name}
      />
    </>
  );
};
