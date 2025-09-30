import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CustomFullscreenModal } from '@/components/ui/custom-fullscreen-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { QuickNameSelector } from './QuickNameSelector';
import { QuickApplicationSelector } from './QuickApplicationSelector';
import { ProductImageGenerator } from './ProductImageGenerator';
import { MolecularStructureViewer } from './MolecularStructureViewer';
import { QuickSegmentSelector } from './QuickSegmentSelector';
import { QuickGroupSelector } from './QuickGroupSelector';
import { useAutoTranslation } from '@/hooks/useAutoTranslation';
import { useMolecularImageGenerator } from '@/hooks/useMolecularImageGenerator';
import { FamiliesManagerModal } from './FamiliesManagerModal';
import { Save, X, Loader2, AlertTriangle, Upload, Download, Settings, Languages, RotateCcw } from 'lucide-react';

interface Family {
  id: string;
  name: string;
  name_en: string | null;
  is_active: boolean;
}

interface Product {
  id?: string;
  name: string;
  name_en: string | null;
  name_id: string | null;
  family_id: string | null;
  compound_type: string | null;
  compound_type_en: string | null;
  molecular_formula: string | null;
  molecular_weight: number | null;
  molecular_structure_image_url: string | null;
  product_format: 'solid' | 'liquid' | null;
  product_image_url: string | null;
  cas_number: string | null;
  cas_note: string | null;
  cas_note_en: string | null;
  is_active: boolean;
  created_by?: string;
  segments?: string[];
  applications?: string[];
  groups?: string[];
}

interface ProductEditorFullscreenProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSuccess: () => void;
}

const STORAGE_KEY = 'product_editor_draft';

export function ProductEditorFullscreen({ isOpen, onClose, product, onSuccess }: ProductEditorFullscreenProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<Product>({
    name: '',
    name_en: null,
    name_id: null,
    family_id: null,
    compound_type: null,
    compound_type_en: null,
    molecular_formula: null,
    molecular_weight: null,
    molecular_structure_image_url: null,
    product_format: null,
    product_image_url: null,
    cas_number: null,
    cas_note: null,
    cas_note_en: null,
    is_active: true,
    segments: [],
    applications: [],
    groups: []
  });
  
  const [families, setFamilies] = useState<Family[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isFamiliesManagerOpen, setIsFamiliesManagerOpen] = useState(false);

  // Hook de tradução automática
  const { translateText, retranslate, isTranslating } = useAutoTranslation({
    context: 'product',
    debounceMs: 1500,
    enabled: true
  });

  // Hook para estrutura molecular
  const {
    imageUrl: molecularImageUrl,
    generateImage: generateMolecularImage,
    uploadImage: uploadMolecularImage,
    clearImage: clearMolecularImage,
    isGenerating: isMolecularGenerating,
    error: molecularError
  } = useMolecularImageGenerator();

  // Função helper para salvar campos de imagem automaticamente
  const saveImageField = async (field: string, url: string | null) => {
    if (!formData.id) {
      toast({
        title: "Imagem será salva",
        description: "A imagem será salva quando você clicar em 'Criar Produto'.",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('site_products')
        .update({ [field]: url })
        .eq('id', formData.id);

      if (error) throw error;

      toast({
        title: "Imagem salva!",
        description: "A imagem foi salva automaticamente.",
      });
    } catch (error) {
      console.error('Erro ao salvar imagem:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a imagem automaticamente.",
        variant: "destructive",
      });
    }
  };

  // Load families
  const loadFamilies = async () => {
    try {
      const { data, error } = await supabase
        .from('site_product_families')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setFamilies(data || []);
    } catch (error) {
      console.error('Erro ao carregar famílias:', error);
    }
  };

  // Load existing product data for editing
  const loadProductData = async (productId: string) => {
    try {
      // Load main product data
      const { data: productData, error: productError } = await supabase
        .from('site_products')
        .select(`
          *,
          site_product_names!site_products_name_id_fkey(id, name, name_en)
        `)
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      // Load segments
      const { data: segmentsData } = await supabase
        .from('site_product_segments_map')
        .select('segment_id')
        .eq('product_id', productId);

      // Load applications
      const { data: applicationsData } = await supabase
        .from('site_product_applications_map')
        .select('application_id')
        .eq('product_id', productId);

      // Load groups
      const { data: groupsData } = await supabase
        .from('site_product_groups_map')
        .select('group_id')
        .eq('product_id', productId);

      setFormData({
        ...productData,
        name: productData.site_product_names?.name || productData.name || '',
        name_en: productData.site_product_names?.name_en || productData.name_en,
        product_format: productData.product_format as 'solid' | 'liquid' | null,
        segments: segmentsData?.map(s => s.segment_id) || [],
        applications: applicationsData?.map(a => a.application_id) || [],
        groups: groupsData?.map(g => g.group_id) || []
      });
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do produto',
        variant: 'destructive'
      });
    }
  };

  // Save draft to sessionStorage
  const saveDraft = () => {
    if (hasUnsavedChanges) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  };

  // Load draft from sessionStorage
  const loadDraft = () => {
    const draft = sessionStorage.getItem(STORAGE_KEY);
    if (draft && !product) {
      try {
        const parsedDraft = JSON.parse(draft);
        setFormData(parsedDraft);
        setHasUnsavedChanges(true);
        toast({
          title: 'Rascunho carregado',
          description: 'Seus dados não salvos foram restaurados'
        });
      } catch (error) {
        console.error('Erro ao carregar rascunho:', error);
      }
    }
  };

  // Clear draft
  const clearDraft = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setHasUnsavedChanges(false);
  };

  // Initialize data on mount
  useEffect(() => {
    if (isOpen) {
      loadFamilies();
      
      // Set persistence flag
      sessionStorage.setItem('product_editor_should_reopen', '1');
      
      if (product?.id) {
        loadProductData(product.id);
      } else {
        loadDraft();
      }
    } else {
      // Clear persistence flag when closed
      sessionStorage.setItem('product_editor_should_reopen', '0');
    }
  }, [isOpen, product?.id]); // Remove hasUnsavedChanges dependency to prevent reloads

  // Set up auto-save listeners separately
  useEffect(() => {
    if (!isOpen) return;

    const handleVisibilityChange = () => {
      if (document.hidden && hasUnsavedChanges) {
        saveDraft();
      }
    };
    
    const handleBeforeUnload = () => {
      if (hasUnsavedChanges) {
        saveDraft();
      }
    };
    
    const handlePageHide = () => {
      if (hasUnsavedChanges) {
        saveDraft();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [isOpen, hasUnsavedChanges]);

  // Auto-save draft
  useEffect(() => {
    const interval = setInterval(saveDraft, 30000); // Save every 30 seconds
    return () => clearInterval(interval);
  }, [hasUnsavedChanges, formData]);

  // Sync molecular image URL when generated and save automatically
  useEffect(() => {
    if (molecularImageUrl && molecularImageUrl !== formData.molecular_structure_image_url) {
      handleInputChange('molecular_structure_image_url', molecularImageUrl);
      saveImageField('molecular_structure_image_url', molecularImageUrl);
    }
  }, [molecularImageUrl, formData.molecular_structure_image_url]);

  // Handle form data changes
  const handleInputChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  // Handle product name selection
  const handleNameChange = (nameId: string | null) => {
    setFormData(prev => ({ ...prev, name_id: nameId }));
    setHasUnsavedChanges(true);
  };

  // Submit form
  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.name_id) {
      toast({
        title: 'Erro',
        description: 'Nome do produto é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let productId = product?.id;

      if (productId) {
        // Update existing product
        const { error: updateError } = await supabase
          .from('site_products')
          .update({
            name_id: formData.name_id,
            family_id: formData.family_id,
            compound_type: formData.compound_type,
            compound_type_en: formData.compound_type_en,
            molecular_formula: formData.molecular_formula,
            molecular_weight: formData.molecular_weight,
            molecular_structure_image_url: formData.molecular_structure_image_url,
            product_format: formData.product_format,
            product_image_url: formData.product_image_url,
            cas_number: formData.cas_number,
            cas_note: formData.cas_note,
            cas_note_en: formData.cas_note_en,
            is_active: formData.is_active
          })
          .eq('id', productId);

        if (updateError) throw updateError;
      } else {
        // Create new product
        const { data: newProduct, error: insertError } = await supabase
          .from('site_products')
          .insert({
            name: formData.name,
            name_id: formData.name_id,
            family_id: formData.family_id,
            compound_type: formData.compound_type,
            compound_type_en: formData.compound_type_en,
            molecular_formula: formData.molecular_formula,
            molecular_weight: formData.molecular_weight,
            molecular_structure_image_url: formData.molecular_structure_image_url,
            product_format: formData.product_format,
            product_image_url: formData.product_image_url,
            cas_number: formData.cas_number,
            cas_note: formData.cas_note,
            cas_note_en: formData.cas_note_en,
            is_active: formData.is_active,
            created_by: user.id
          })
          .select()
          .single();

        if (insertError) throw insertError;
        productId = newProduct.id;
      }

      // Update mappings for segments - always delete existing first
      await supabase
        .from('site_product_segments_map')
        .delete()
        .eq('product_id', productId);

      if (formData.segments && formData.segments.length > 0) {
        await supabase
          .from('site_product_segments_map')
          .insert(
            formData.segments.map(segmentId => ({
              product_id: productId,
              segment_id: segmentId
            }))
          );
      }

      // Update mappings for applications - always delete existing first
      await supabase
        .from('site_product_applications_map')
        .delete()
        .eq('product_id', productId);

      if (formData.applications && formData.applications.length > 0) {
        await supabase
          .from('site_product_applications_map')
          .insert(
            formData.applications.map(applicationId => ({
              product_id: productId,
              application_id: applicationId,
              created_by: user.id
            }))
          );
      }

      // Update mappings for groups - always delete existing first
      await supabase
        .from('site_product_groups_map')
        .delete()
        .eq('product_id', productId);

      if (formData.groups && formData.groups.length > 0) {
        await supabase
          .from('site_product_groups_map')
          .insert(
            formData.groups.map(groupId => ({
              product_id: productId,
              group_id: groupId,
              created_by: user.id
            }))
          );
      }

      clearDraft();
      toast({
        title: 'Sucesso',
        description: product ? 'Produto atualizado com sucesso' : 'Produto criado com sucesso'
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar produto',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (confirm('Você tem alterações não salvas. Deseja salvar um rascunho antes de sair?')) {
        saveDraft();
      } else {
        clearDraft();
      }
    }
    onClose();
  };

  return (
    <CustomFullscreenModal isOpen={isOpen} onClose={handleClose}>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">
              {product ? 'Editar Produto' : 'Novo Produto'}
            </h1>
            {hasUnsavedChanges && (
              <Badge variant="outline" className="flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                Não salvo
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => saveDraft()}
              disabled={!hasUnsavedChanges}
            >
              <Download className="h-4 w-4 mr-2" />
              Salvar Rascunho
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.name_id}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {product ? 'Atualizar' : 'Criar'} Produto
            </Button>
            
            <Button variant="ghost" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <Tabs defaultValue="basic" className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
              <TabsTrigger value="classification">Classificação</TabsTrigger>
              <TabsTrigger value="images">Imagens</TabsTrigger>
              <TabsTrigger value="details">Detalhes Técnicos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Identificação do Produto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Nome do Produto *</Label>
                    <QuickNameSelector
                      selectedNameId={formData.name_id}
                      onNameChange={handleNameChange}
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="family_id">Família</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsFamiliesManagerOpen(true)}
                        className="h-6 w-6 p-0"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                    <Select 
                      value={formData.family_id || ''} 
                      onValueChange={(value) => handleInputChange('family_id', value || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma família" />
                      </SelectTrigger>
                      <SelectContent>
                        {families.map((family) => (
                          <SelectItem key={family.id} value={family.id}>
                            {family.name}
                            {family.name_en && ` (${family.name_en})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="compound_type">Particularidade</Label>
                    <Input
                      id="compound_type"
                      value={formData.compound_type || ''}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        handleInputChange('compound_type', newValue);
                        
                        // Traduzir automaticamente para inglês
                        if (newValue.trim()) {
                          translateText(newValue, 'compound_type', (translation) => {
                            handleInputChange('compound_type_en', translation);
                          });
                        }
                      }}
                      placeholder="Ex: Sal inorgânico, Óxido metálico..."
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label htmlFor="compound_type_en">Particularidades em Inglês</Label>
                      {isTranslating && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Languages className="w-3 h-3 animate-pulse" />
                          Traduzindo...
                        </div>
                      )}
                      {formData.compound_type_en && !isTranslating && formData.compound_type && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (formData.compound_type?.trim()) {
                              retranslate(formData.compound_type, 'compound_type', (translation) => {
                                handleInputChange('compound_type_en', translation);
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
                      id="compound_type_en"
                      value={formData.compound_type_en || ''}
                      onChange={(e) => handleInputChange('compound_type_en', e.target.value)}
                      placeholder="Ex: Inorganic salt, Metal oxide... (tradução automática)"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Tradução automática ativada. Você pode editar manualmente ou retraduzir.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                    />
                    <Label htmlFor="is_active">Produto Ativo</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="classification" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Classificação e Categorização</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div>
                     <Label className="mb-2 block">Segmentos</Label>
                     <QuickSegmentSelector
                       selectedSegments={formData.segments || []}
                       onSegmentsChange={(segments) => handleInputChange('segments', segments)}
                     />
                   </div>
                  
                   <div>
                     <Label className="mb-2 block">Aplicações</Label>
                     <QuickApplicationSelector
                       selectedApplications={formData.applications || []}
                       onApplicationsChange={(applications) => handleInputChange('applications', applications)}
                     />
                   </div>
                  
                   <div>
                     <Label className="mb-2 block">Grupos</Label>
                     <QuickGroupSelector
                       selectedGroups={formData.groups || []}
                       onGroupsChange={(groups) => handleInputChange('groups', groups)}
                     />
                   </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="images" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Estrutura Molecular</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MolecularStructureViewer
                      molecularFormula={formData.molecular_formula}
                      productFormat={formData.product_format}
                      productId={formData.id}
                      imageUrl={molecularImageUrl || formData.molecular_structure_image_url}
                      isGenerating={isMolecularGenerating}
                      error={molecularError}
                      productName={formData.name || 'Produto'}
                      onGenerate={async () => {
                        if (formData.molecular_formula) {
                          await generateMolecularImage(formData.molecular_formula, formData.id);
                        }
                      }}
                      onClear={() => {
                        clearMolecularImage();
                        handleInputChange('molecular_structure_image_url', null);
                      }}
                      onUpload={async (file: File) => {
                        await uploadMolecularImage(file, formData.id);
                      }}
                      onImageGenerated={(imageUrl) => handleInputChange('molecular_structure_image_url', imageUrl)}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Imagem do Produto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProductImageGenerator
                      molecularFormula={formData.molecular_formula}
                      productFormat={formData.product_format}
                      productId={formData.id}
                      currentImageUrl={formData.product_image_url}
                      productName={formData.name || 'Produto'}
                      onImageGenerated={(imageUrl) => {
                        handleInputChange('product_image_url', imageUrl);
                        saveImageField('product_image_url', imageUrl);
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes Técnicos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="molecular_formula">Fórmula Molecular</Label>
                    <Input
                      id="molecular_formula"
                      value={formData.molecular_formula || ''}
                      onChange={(e) => handleInputChange('molecular_formula', e.target.value)}
                      placeholder="Ex: H2SO4, CaCO3..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="molecular_weight">Peso Molecular</Label>
                    <Input
                      id="molecular_weight"
                      type="number"
                      step="0.01"
                      value={formData.molecular_weight || ''}
                      onChange={(e) => handleInputChange('molecular_weight', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="Ex: 98.08"
                    />
                  </div>

                  <div>
                    <Label htmlFor="product_format">Formato do Produto</Label>
                    <Select 
                      value={formData.product_format || ''} 
                      onValueChange={(value) => handleInputChange('product_format', value || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o formato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">Sólido</SelectItem>
                        <SelectItem value="liquid">Líquido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="cas_number">Número CAS</Label>
                    <Input
                      id="cas_number"
                      value={formData.cas_number || ''}
                      onChange={(e) => handleInputChange('cas_number', e.target.value)}
                      placeholder="Ex: 7732-18-5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cas_note">Nota CAS</Label>
                    <Textarea
                      id="cas_note"
                      value={formData.cas_note || ''}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        handleInputChange('cas_note', newValue);
                        
                        // Traduzir automaticamente para inglês
                        if (newValue.trim()) {
                          translateText(newValue, 'cas_note', (translation) => {
                            handleInputChange('cas_note_en', translation);
                          });
                        }
                      }}
                      placeholder="Observações sobre o número CAS..."
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label htmlFor="cas_note_en">Nota CAS (EN)</Label>
                      {isTranslating && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Languages className="w-3 h-3 animate-pulse" />
                          Traduzindo...
                        </div>
                      )}
                      {formData.cas_note_en && !isTranslating && formData.cas_note && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (formData.cas_note?.trim()) {
                              retranslate(formData.cas_note, 'cas_note', (translation) => {
                                handleInputChange('cas_note_en', translation);
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
                    <Textarea
                      id="cas_note_en"
                      value={formData.cas_note_en || ''}
                      onChange={(e) => handleInputChange('cas_note_en', e.target.value)}
                      placeholder="CAS number observations... (tradução automática)"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Tradução automática ativada. Você pode editar manualmente ou retraduzir.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Families Manager Modal */}
      <FamiliesManagerModal
        open={isFamiliesManagerOpen}
        onOpenChange={setIsFamiliesManagerOpen}
        onChanged={() => {
          loadFamilies();
          // Check if currently selected family still exists
          if (formData.family_id) {
            supabase
              .from('site_product_families')
              .select('id')
              .eq('id', formData.family_id)
              .single()
              .then(({ data, error }) => {
                if (error || !data) {
                  // Family was deleted, clear selection
                  handleInputChange('family_id', null);
                  toast({
                    title: 'Família removida',
                    description: 'A família selecionada foi excluída. Selecione uma nova família.',
                    variant: 'default'
                  });
                }
              });
          }
        }}
      />
    </CustomFullscreenModal>
  );
}