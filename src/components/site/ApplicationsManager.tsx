import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomFullscreenModal } from "@/components/ui/custom-fullscreen-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Save, X, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateColorFromName } from "@/utils/colorUtils";
import { useAutoTranslation } from '@/hooks/useAutoTranslation';
import { RotateCcw, Languages } from 'lucide-react';

interface Application {
  id: string;
  name: string;
  name_en?: string;
  color: string;
  is_active: boolean;
}

interface ApplicationsManagerProps {
  trigger?: React.ReactNode;
  onApplicationsChange?: () => void;
}


const STORAGE_KEY = 'applications_manager_form_data';

export const ApplicationsManager = ({ trigger, onApplicationsChange }: ApplicationsManagerProps) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_en: ''
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();
  
  // Hook de tradução automática
  const { translateText, retranslate, isTranslating } = useAutoTranslation({
    context: 'application',
    debounceMs: 1500,
    enabled: true
  });

  // Salvar dados no localStorage quando formulário muda
  const saveFormData = useCallback(() => {
    if (formData.name.trim() || formData.name_en.trim()) {
      const dataToSave = {
        ...formData,
        editingAppId: editingApp?.id || null,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      setHasUnsavedChanges(true);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setHasUnsavedChanges(false);
    }
  }, [formData, editingApp]);

  // Carregar dados do localStorage quando modal abre
  const loadSavedFormData = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        // Verificar se os dados não são muito antigos (1 hora)
        if (Date.now() - data.timestamp < 3600000) {
          setFormData({
            name: data.name || '',
            name_en: data.name_en || ''
          });
          
          // Se havia uma aplicação sendo editada, tentar restaurar
          if (data.editingAppId) {
            const app = applications.find(a => a.id === data.editingAppId);
            if (app) {
              setEditingApp(app);
            }
          }
          
          setHasUnsavedChanges(true);
          toast({
            title: "Rascunho restaurado",
            description: "Dados do formulário foram restaurados automaticamente"
          });
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados salvos:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [applications, toast]);

  // Salvar dados automaticamente quando formulário muda
  useEffect(() => {
    if (isOpen) {
      saveFormData();
    }
  }, [formData, saveFormData, isOpen]);

  const loadApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('site_product_applications')
        .select('*')
        .order('is_active', { ascending: false })
        .order('name');

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Erro ao carregar aplicações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar aplicações",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadApplications();
    }
  }, [isOpen]);

  // Carregar dados salvos após carregar aplicações
  useEffect(() => {
    if (isOpen && applications.length > 0) {
      loadSavedFormData();
    }
  }, [isOpen, applications, loadSavedFormData]);

  const resetForm = () => {
    setFormData({
      name: '',
      name_en: ''
    });
    setEditingApp(null);
    setHasUnsavedChanges(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const applicationData = {
        name: formData.name.trim(),
        name_en: formData.name_en.trim() || null,
        color: generateColorFromName(formData.name.trim()),
        created_by: user.id
      };

      if (editingApp) {
        const { error } = await supabase
          .from('site_product_applications')
          .update(applicationData)
          .eq('id', editingApp.id);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Aplicação atualizada com sucesso"
        });
      } else {
        const { error } = await supabase
          .from('site_product_applications')
          .insert(applicationData);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Aplicação criada com sucesso"
        });
      }

      resetForm();
      loadApplications();
      onApplicationsChange?.();
    } catch (error) {
      console.error('Erro ao salvar aplicação:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar aplicação",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (application: Application) => {
    setEditingApp(application);
    setFormData({
      name: application.name,
      name_en: application.name_en || ''
    });
  };

  const checkApplicationUsage = async (applicationId: string) => {
    const { data, error } = await supabase
      .from("site_product_applications_map")
      .select("id")
      .eq("application_id", applicationId);
    
    if (error) throw error;
    return data?.length || 0;
  };

  const handleDelete = async (application: Application) => {
    try {
      // Check if application is being used
      const usageCount = await checkApplicationUsage(application.id);
      
      if (usageCount > 0) {
        toast({
          title: "Não é possível excluir",
          description: `Esta aplicação está sendo usada em ${usageCount} produto(s).`,
          variant: "destructive"
        });
        return;
      }

      // Confirm deletion
      if (!confirm(`Tem certeza que deseja excluir permanentemente a aplicação "${application.name}"?`)) {
        return;
      }

      const { error } = await supabase
        .from("site_product_applications")
        .delete()
        .eq("id", application.id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Aplicação excluída com sucesso!"
      });
      
      loadApplications();
      onApplicationsChange?.();
    } catch (error) {
      console.error("Error deleting application:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir aplicação",
        variant: "destructive"
      });
    }
  };

  const handleToggleActive = async (application: Application) => {
    try {
      const { error } = await supabase
        .from('site_product_applications')
        .update({ is_active: !application.is_active })
        .eq('id', application.id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: `Aplicação ${application.is_active ? 'desativada' : 'ativada'} com sucesso`
      });
      
      loadApplications();
      onApplicationsChange?.();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status da aplicação",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      {trigger && (
        <div onClick={() => setIsOpen(true)}>
          {trigger}
        </div>
      )}

      <CustomFullscreenModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">
              Gerenciar Aplicações de Produtos
            </h1>
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-xs">
                <Save className="w-3 h-3 mr-1" />
                Dados salvos automaticamente
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
            {/* Formulário */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingApp ? 'Editar Aplicação' : 'Nova Aplicação'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome (Português) *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setFormData({ ...formData, name: newValue });
                      
                      // Traduzir automaticamente para inglês
                      if (newValue.trim()) {
                        translateText(newValue, 'application', (translation) => {
                          setFormData(prev => ({ ...prev, name_en: translation }));
                        });
                      }
                    }}
                    placeholder="Ex: Produtos de limpeza"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="name_en">Nome (Inglês)</Label>
                    {isTranslating && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Languages className="w-3 h-3 animate-pulse" />
                        Traduzindo...
                      </div>
                    )}
                    {formData.name_en && !isTranslating && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (formData.name.trim()) {
                            retranslate(formData.name, 'application', (translation) => {
                              setFormData(prev => ({ ...prev, name_en: translation }));
                            });
                          }
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Retraduzir
                      </Button>
                    )}
                  </div>
                  <Input
                    id="name_en"
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    placeholder="Ex: Cleaning products (tradução automática)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tradução automática ativada. Você pode editar manualmente ou retraduzir.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Prévia da Cor (gerada automaticamente)</Label>
                  <Badge style={{ backgroundColor: generateColorFromName(formData.name), color: 'white' }}>
                    {formData.name || 'Nome da aplicação'}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    A cor é gerada automaticamente baseada no nome da aplicação
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex-1">
                    {editingApp ? 'Atualizar' : 'Criar'} Aplicação
                  </Button>
                  {editingApp && (
                    <Button variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lista de Aplicações */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Aplicações Existentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className={`p-3 border rounded-lg ${
                        app.is_active ? 'bg-card' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              style={{ backgroundColor: app.color, color: 'white' }}
                              className="text-xs"
                            >
                              {app.name}
                            </Badge>
                            {!app.is_active && (
                              <Badge variant="secondary" className="text-xs">
                                Inativo
                              </Badge>
                            )}
                          </div>
                          {app.name_en && (
                            <p className="text-sm text-muted-foreground">
                              EN: {app.name_en}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(app)}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(app)}
                            className={app.is_active ? 'text-orange-600' : 'text-green-600'}
                            title={app.is_active ? 'Desativar' : 'Ativar'}
                          >
                            {app.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(app)}
                            className="text-red-600 hover:text-red-700"
                            title="Excluir permanentemente"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {applications.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      Nenhuma aplicação cadastrada
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CustomFullscreenModal>
    </>
  );
};