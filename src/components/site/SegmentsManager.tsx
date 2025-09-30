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

interface Segment {
  id: string;
  name: string;
  name_en?: string;
  color: string;
  is_active: boolean;
}

interface SegmentsManagerProps {
  trigger?: React.ReactNode;
  onSegmentsChange?: () => void;
}

const STORAGE_KEY = 'segments_manager_form_data';

export const SegmentsManager = ({ trigger, onSegmentsChange }: SegmentsManagerProps) => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_en: ''
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();
  
  // Hook de tradução automática
  const { translateText, retranslate, isTranslating } = useAutoTranslation({
    context: 'segment',
    debounceMs: 1500,
    enabled: true
  });

  // Salvar dados no localStorage quando formulário muda
  const saveFormData = useCallback(() => {
    if (formData.name.trim() || formData.name_en.trim()) {
      const dataToSave = {
        ...formData,
        editingSegmentId: editingSegment?.id || null,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      setHasUnsavedChanges(true);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setHasUnsavedChanges(false);
    }
  }, [formData, editingSegment]);

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
          
          // Se havia um segmento sendo editado, tentar restaurar
          if (data.editingSegmentId) {
            const segment = segments.find(s => s.id === data.editingSegmentId);
            if (segment) {
              setEditingSegment(segment);
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
  }, [segments, toast]);

  // Salvar dados automaticamente quando formulário muda
  useEffect(() => {
    if (isOpen) {
      saveFormData();
    }
  }, [formData, saveFormData, isOpen]);

  const loadSegments = async () => {
    try {
      const { data, error } = await supabase
        .from('site_product_segments')
        .select('*')
        .order('is_active', { ascending: false })
        .order('name');

      if (error) throw error;
      setSegments((data || []).map((segment: any) => ({
        ...segment,
        color: segment.color || generateColorFromName(segment.name)
      })));
    } catch (error) {
      console.error('Erro ao carregar segmentos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar segmentos",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSegments();
    }
  }, [isOpen]);

  // Carregar dados salvos após carregar segmentos
  useEffect(() => {
    if (isOpen && segments.length > 0) {
      loadSavedFormData();
    }
  }, [isOpen, segments, loadSavedFormData]);

  const resetForm = () => {
    setFormData({
      name: '',
      name_en: ''
    });
    setEditingSegment(null);
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

      const segmentData = {
        name: formData.name.trim(),
        name_en: formData.name_en.trim() || null,
        color: generateColorFromName(formData.name.trim()),
        created_by: user.id
      };

      if (editingSegment) {
        const { error } = await supabase
          .from('site_product_segments')
          .update(segmentData)
          .eq('id', editingSegment.id);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Segmento atualizado com sucesso"
        });
      } else {
        const { error } = await supabase
          .from('site_product_segments')
          .insert(segmentData);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Segmento criado com sucesso"
        });
      }

      resetForm();
      loadSegments();
      onSegmentsChange?.();
    } catch (error) {
      console.error('Erro ao salvar segmento:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar segmento",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (segment: Segment) => {
    setEditingSegment(segment);
    setFormData({
      name: segment.name,
      name_en: segment.name_en || ''
    });
  };

  const checkSegmentUsage = async (segmentId: string) => {
    const { data, error } = await supabase
      .from("site_product_segments_map")
      .select("id")
      .eq("segment_id", segmentId);
    
    if (error) throw error;
    return data?.length || 0;
  };

  const handleDelete = async (segment: Segment) => {
    try {
      // Check if segment is being used
      const usageCount = await checkSegmentUsage(segment.id);
      
      if (usageCount > 0) {
        toast({
          title: "Não é possível excluir",
          description: `Este segmento está sendo usado em ${usageCount} produto(s).`,
          variant: "destructive"
        });
        return;
      }

      // Confirm deletion
      if (!confirm(`Tem certeza que deseja excluir permanentemente o segmento "${segment.name}"?`)) {
        return;
      }

      const { error } = await supabase
        .from("site_product_segments")
        .delete()
        .eq("id", segment.id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Segmento excluído com sucesso!"
      });
      
      loadSegments();
      onSegmentsChange?.();
    } catch (error) {
      console.error("Error deleting segment:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir segmento",
        variant: "destructive"
      });
    }
  };

  const handleToggleActive = async (segment: Segment) => {
    try {
      const { error } = await supabase
        .from('site_product_segments')
        .update({ is_active: !segment.is_active })
        .eq('id', segment.id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: `Segmento ${segment.is_active ? 'desativado' : 'ativado'} com sucesso`
      });
      
      loadSegments();
      onSegmentsChange?.();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do segmento",
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
              Gerenciar Segmentos de Produtos
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
                  {editingSegment ? 'Editar Segmento' : 'Novo Segmento'}
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
                        translateText(newValue, 'segment', (translation) => {
                          setFormData(prev => ({ ...prev, name_en: translation }));
                        });
                      }
                    }}
                    placeholder="Ex: Alimentício"
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
                            retranslate(formData.name, 'segment', (translation) => {
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
                    placeholder="Ex: Food (tradução automática)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tradução automática ativada. Você pode editar manualmente ou retraduzir.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Prévia da Cor (gerada automaticamente)</Label>
                  <Badge style={{ backgroundColor: generateColorFromName(formData.name), color: 'white' }}>
                    {formData.name || 'Nome do segmento'}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    A cor é gerada automaticamente baseada no nome do segmento
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex-1">
                    {editingSegment ? 'Atualizar' : 'Criar'} Segmento
                  </Button>
                  {editingSegment && (
                    <Button variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lista de Segmentos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Segmentos Existentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {segments.map((segment) => (
                    <div
                      key={segment.id}
                      className={`p-3 border rounded-lg ${
                        segment.is_active ? 'bg-card' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              style={{ backgroundColor: segment.color, color: 'white' }}
                              className="text-xs"
                            >
                              {segment.name}
                            </Badge>
                            {!segment.is_active && (
                              <Badge variant="secondary" className="text-xs">
                                Inativo
                              </Badge>
                            )}
                          </div>
                          {segment.name_en && (
                            <p className="text-sm text-muted-foreground">
                              EN: {segment.name_en}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(segment)}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(segment)}
                            className={segment.is_active ? 'text-orange-600' : 'text-green-600'}
                            title={segment.is_active ? 'Desativar' : 'Ativar'}
                          >
                            {segment.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(segment)}
                            className="text-red-600 hover:text-red-700"
                            title="Excluir permanentemente"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CustomFullscreenModal>
    </>
  );
};