import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2, Upload, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuickNameSelector } from '@/components/site/QuickNameSelector';
import SiteProductsCSVImportModal from '@/components/site/SiteProductsCSVImportModal';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';

interface Product {
  id: string;
  name: string;
  name_en?: string;
  name_id?: string;
  family_id?: string;
  product_format?: string;
  compound_type?: string;
  compound_type_en?: string;
  molecular_formula?: string;
  molecular_weight?: number;
  molecular_structure_image_url?: string;
  product_image_url?: string;
  cas_number?: string;
  cas_note?: string;
  cas_note_en?: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
  updated_at?: string;
  site_product_names?: {
    id: string;
    name: string;
    name_en?: string;
  };
  site_product_families?: {
    id: string;
    name: string;
    name_en?: string;
  };
}

const SiteProducts = () => {
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    name_id: '',
    family_id: '',
    product_format: '',
    cas_number: '',
    cas_note: '',
    cas_note_en: '',
    compound_type: '',
    compound_type_en: '',
    molecular_formula: '',
    molecular_weight: '',
    molecular_structure_image_url: '',
    product_image_url: '',
    is_active: true,
  });

  const queryClient = useQueryClient();

  // Load draft functionality
  const loadDraft = () => {
    const draft = sessionStorage.getItem('site_product_draft');
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        console.log('=== DRAFT CARREGADO ===', parsedDraft);
        
        // Check if has relevant data (not just empty strings)
        const hasRelevantData = Object.entries(parsedDraft).some(([key, value]) => {
          if (['name', 'name_en', 'cas_number', 'cas_note', 'cas_note_en', 
               'compound_type', 'compound_type_en', 'molecular_formula', 'molecular_weight',
               'molecular_structure_image_url', 'product_image_url'].includes(key)) {
            return value && String(value).trim() !== '';
          }
          if (['name_id', 'family_id', 'product_format'].includes(key)) {
            return value && String(value).trim() !== '';
          }
          return false;
        });

        if (hasRelevantData) {
          // Check if form was explicitly open
          const wasFormOpen = sessionStorage.getItem('product_form_was_open') === 'true';
          const editingProductId = sessionStorage.getItem('editing_product_id');
          
          if (wasFormOpen) {
            console.log('=== RESTAURANDO FORMULÁRIO ===');
            setFormData(parsedDraft);
            
            // If was editing, restore the selected product
            if (editingProductId) {
              // We'll set this after the query loads
              console.log('=== EDITANDO PRODUTO ===', editingProductId);
            }
            
            setIsFormOpen(true);
            toast.success('Rascunho restaurado!');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar rascunho:', error);
      }
    }
  };

  const saveDraft = (data: any) => {
    console.log('=== SALVANDO DRAFT ===', data);
    sessionStorage.setItem('site_product_draft', JSON.stringify(data));
  };

  const clearDraft = () => {
    console.log('=== LIMPANDO DRAFT ===');
    sessionStorage.removeItem('site_product_draft');
    sessionStorage.removeItem('product_form_was_open');
    sessionStorage.removeItem('editing_product_id');
  };

  // Auto-save draft when form data changes
  useEffect(() => {
    if (isFormOpen) {
      saveDraft(formData);
      sessionStorage.setItem('product_form_was_open', 'true');
    }
  }, [formData, isFormOpen]);

  // Load draft on mount
  useEffect(() => {
    loadDraft();
  }, []);

  // Query for products with enhanced joins - fix the relationship issue
  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ['site-products'],
    queryFn: async () => {
      console.log('=== BUSCANDO PRODUTOS ===');
      const { data, error } = await supabase
        .from('site_products')
        .select(`
          *,
          site_product_names!name_id (
            id,
            name,
            name_en
          ),
          site_product_families!family_id (
            id,
            name,
            name_en
          )
        `)
        .order('name', { ascending: true });

      if (error) {
        console.error('Erro ao buscar produtos:', error);
        throw error;
      }

      console.log('=== PRODUTOS ENCONTRADOS ===', data?.length || 0);
      return data || [];
    },
  });

  // Restore editing product after query loads
  useEffect(() => {
    if (products && products.length > 0) {
      const editingProductId = sessionStorage.getItem('editing_product_id');
      if (editingProductId && isFormOpen && !selectedProduct) {
        const productToEdit = products.find(p => p.id === editingProductId);
        if (productToEdit) {
          console.log('=== RESTAURANDO PRODUTO EDITADO ===', productToEdit);
          setSelectedProduct(productToEdit);
        }
      }
    }
  }, [products, isFormOpen, selectedProduct]);

  const resetForm = () => {
    setFormData({
      name: '',
      name_en: '',
      name_id: '',
      family_id: '',
      product_format: '',
      cas_number: '',
      cas_note: '',
      cas_note_en: '',
      compound_type: '',
      compound_type_en: '',
      molecular_formula: '',
      molecular_weight: '',
      molecular_structure_image_url: '',
      product_image_url: '',
      is_active: true,
    });
    setSelectedProduct(null);
    clearDraft();
  };

  const handleOpenForm = () => {
    resetForm();
    setIsFormOpen(true);
    sessionStorage.setItem('product_form_was_open', 'true');
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    resetForm();
  };

  const handleEdit = async (product: Product) => {
    console.log('=== EDITANDO PRODUTO ===', product);
    
    // Fetch the complete product data to ensure we have all relationships
    try {
      const { data: fullProduct, error } = await supabase
        .from('site_products')
        .select(`
          *,
          site_product_names!name_id (
            id,
            name,
            name_en
          ),
          site_product_families!family_id (
            id,
            name,
            name_en
          )
        `)
        .eq('id', product.id)
        .single();

      if (error) {
        console.error('Erro ao buscar produto completo:', error);
        toast.error('Erro ao carregar dados do produto');
        return;
      }

      console.log('=== PRODUTO COMPLETO ===', fullProduct);

      setSelectedProduct(fullProduct);
      sessionStorage.setItem('editing_product_id', product.id);
      sessionStorage.setItem('product_form_was_open', 'true');
      
      setFormData({
        name: fullProduct.name || '',
        name_en: fullProduct.name_en || '',
        name_id: fullProduct.name_id || '',
        family_id: fullProduct.family_id || '',
        product_format: fullProduct.product_format || '',
        cas_number: fullProduct.cas_number || '',
        cas_note: fullProduct.cas_note || '',
        cas_note_en: fullProduct.cas_note_en || '',
        compound_type: fullProduct.compound_type || '',
        compound_type_en: fullProduct.compound_type_en || '',
        molecular_formula: fullProduct.molecular_formula || '',
        molecular_weight: fullProduct.molecular_weight?.toString() || '',
        molecular_structure_image_url: fullProduct.molecular_structure_image_url || '',
        product_image_url: fullProduct.product_image_url || '',
        is_active: fullProduct.is_active ?? true,
      });
      
      setIsFormOpen(true);
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado ao carregar produto');
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      console.log('=== SALVANDO PRODUTO ===', formData);

      const productData = {
        name: formData.name,
        name_en: formData.name_en || null,
        name_id: formData.name_id || null,
        family_id: formData.family_id || null,
        product_format: formData.product_format || null,
        cas_number: formData.cas_number || null,
        cas_note: formData.cas_note || null,
        cas_note_en: formData.cas_note_en || null,
        compound_type: formData.compound_type || null,
        compound_type_en: formData.compound_type_en || null,
        molecular_formula: formData.molecular_formula || null,
        molecular_weight: formData.molecular_weight ? parseFloat(formData.molecular_weight) : null,
        molecular_structure_image_url: formData.molecular_structure_image_url || null,
        product_image_url: formData.product_image_url || null,
        is_active: formData.is_active,
        created_by: user.id, // Add required created_by field
      };

      if (selectedProduct) {
        // For updates, remove created_by to avoid conflicts
        const { created_by, ...updateData } = productData;
        const { error } = await supabase
          .from('site_products')
          .update(updateData)
          .eq('id', selectedProduct.id);

        if (error) throw error;
        toast.success('Produto atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('site_products')
          .insert(productData);

        if (error) throw error;
        toast.success('Produto criado com sucesso!');
      }

      handleCloseForm();
      refetch();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast.error('Erro ao salvar produto');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        const { error } = await supabase
          .from('site_products')
          .delete()
          .eq('id', id);

        if (error) throw error;
        toast.success('Produto excluído com sucesso!');
        refetch();
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        toast.error('Erro ao excluir produto');
      }
    }
  };

  const filteredProducts = products?.filter(product => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    // Search in direct product fields
    const nameMatch = product.name?.toLowerCase().includes(searchLower);
    const nameEnMatch = product.name_en?.toLowerCase().includes(searchLower);
    const casMatch = product.cas_number?.toLowerCase().includes(searchLower);
    const formulaMatch = product.molecular_formula?.toLowerCase().includes(searchLower);
    
    // Search in related name - safe access
    const relatedNameMatch = product.site_product_names && typeof product.site_product_names === 'object' && 'name' in product.site_product_names 
      ? product.site_product_names.name?.toLowerCase().includes(searchLower) 
      : false;
    const relatedNameEnMatch = product.site_product_names && typeof product.site_product_names === 'object' && 'name_en' in product.site_product_names 
      ? product.site_product_names.name_en?.toLowerCase().includes(searchLower) 
      : false;
    
    // Search in related family - safe access
    const familyMatch = product.site_product_families && typeof product.site_product_families === 'object' && 'name' in product.site_product_families 
      ? product.site_product_families.name?.toLowerCase().includes(searchLower) 
      : false;
    const familyEnMatch = product.site_product_families && typeof product.site_product_families === 'object' && 'name_en' in product.site_product_families 
      ? product.site_product_families.name_en?.toLowerCase().includes(searchLower) 
      : false;
    
    return nameMatch || nameEnMatch || casMatch || formulaMatch || 
           relatedNameMatch || relatedNameEnMatch || familyMatch || familyEnMatch;
  }) || [];

  const exportToCSV = () => {
    if (!products || products.length === 0) {
      toast.error('Nenhum produto para exportar');
      return;
    }

    const csvData = products.map(product => ({
      'Nome': product.name || '',
      'Nome (EN)': product.name_en || '',
      'Nome do Produto': product.site_product_names && typeof product.site_product_names === 'object' && 'name' in product.site_product_names ? product.site_product_names.name : '',
      'Família': product.site_product_families && typeof product.site_product_families === 'object' && 'name' in product.site_product_families ? product.site_product_families.name : '',
      'Formato': product.product_format || '',
      'CAS': product.cas_number || '',
      'Fórmula': product.molecular_formula || '',
      'Peso Molecular': product.molecular_weight || '',
      'Ativo': product.is_active ? 'Sim' : 'Não'
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'produtos_site.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Produtos exportados com sucesso!');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando produtos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestão de Produtos do Site</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar CSV
          </Button>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenForm}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedProduct ? 'Editar Produto' : 'Novo Produto'}
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                  <TabsTrigger value="technical">Dados Técnicos</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="name_en">Nome (Inglês)</Label>
                      <Input
                        id="name_en"
                        value={formData.name_en}
                        onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Nome do Produto</Label>
                    <QuickNameSelector
                      selectedNameId={formData.name_id}
                      onNameChange={(value) => setFormData({ ...formData, name_id: value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="family_id">Família do Produto</Label>
                      <Select
                        value={formData.family_id}
                        onValueChange={(value) => setFormData({ ...formData, family_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma família" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Selecione uma família</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="product_format">Formato do Produto</Label>
                      <Select
                        value={formData.product_format}
                        onValueChange={(value) => setFormData({ ...formData, product_format: value })}
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
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Produto ativo</Label>
                  </div>
                </TabsContent>

                <TabsContent value="technical" className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="cas_number">Número CAS</Label>
                      <Input
                        id="cas_number"
                        value={formData.cas_number}
                        onChange={(e) => setFormData({ ...formData, cas_number: e.target.value })}
                        placeholder="Ex: 7732-18-5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="molecular_formula">Fórmula Molecular</Label>
                      <Input
                        id="molecular_formula"
                        value={formData.molecular_formula}
                        onChange={(e) => setFormData({ ...formData, molecular_formula: e.target.value })}
                        placeholder="Ex: H2O"
                      />
                    </div>
                    <div>
                      <Label htmlFor="molecular_weight">Peso Molecular</Label>
                      <Input
                        id="molecular_weight"
                        type="number"
                        step="0.01"
                        value={formData.molecular_weight}
                        onChange={(e) => setFormData({ ...formData, molecular_weight: e.target.value })}
                        placeholder="Ex: 18.015"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cas_note">Observação CAS (Português)</Label>
                      <Input
                        id="cas_note"
                        value={formData.cas_note}
                        onChange={(e) => setFormData({ ...formData, cas_note: e.target.value })}
                        placeholder="Ex: Solução 50%"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cas_note_en">Observação CAS (Inglês)</Label>
                      <Input
                        id="cas_note_en"
                        value={formData.cas_note_en}
                        onChange={(e) => setFormData({ ...formData, cas_note_en: e.target.value })}
                        placeholder="Ex: 50% solution"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="compound_type">Tipo de Composto (Português)</Label>
                      <Input
                        id="compound_type"
                        value={formData.compound_type}
                        onChange={(e) => setFormData({ ...formData, compound_type: e.target.value })}
                        placeholder="Ex: Anidro"
                      />
                    </div>
                    <div>
                      <Label htmlFor="compound_type_en">Tipo de Composto (Inglês)</Label>
                      <Input
                        id="compound_type_en"
                        value={formData.compound_type_en}
                        onChange={(e) => setFormData({ ...formData, compound_type_en: e.target.value })}
                        placeholder="Ex: Anhydrous"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="molecular_structure_image_url">URL da Estrutura Molecular</Label>
                      <Input
                        id="molecular_structure_image_url"
                        value={formData.molecular_structure_image_url}
                        onChange={(e) => setFormData({ ...formData, molecular_structure_image_url: e.target.value })}
                        placeholder="https://example.com/structure.png"
                      />
                    </div>
                    <div>
                      <Label htmlFor="product_image_url">URL da Imagem do Produto</Label>
                      <Input
                        id="product_image_url"
                        value={formData.product_image_url}
                        onChange={(e) => setFormData({ ...formData, product_image_url: e.target.value })}
                        placeholder="https://example.com/product.jpg"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button variant="outline" onClick={handleCloseForm}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  {selectedProduct ? 'Atualizar' : 'Criar'} Produto
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <Input
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Badge variant="secondary">
          {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-4">
        {filteredProducts.map((product) => (
          <Card key={product.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    {product.name}
                    {!product.is_active && (
                      <Badge variant="secondary" className="ml-2">Inativo</Badge>
                    )}
                  </CardTitle>
                  {product.name_en && (
                    <p className="text-sm text-muted-foreground">{product.name_en}</p>
                  )}
                  {product.site_product_names && typeof product.site_product_names === 'object' && 'name' in product.site_product_names && (
                    <p className="text-sm font-medium text-blue-600">
                      Nome: {product.site_product_names.name}
                      {product.site_product_names.name_en && (
                        <span className="text-muted-foreground"> ({product.site_product_names.name_en})</span>
                      )}
                    </p>
                  )}
                  {product.site_product_families && typeof product.site_product_families === 'object' && 'name' in product.site_product_families && (
                    <p className="text-sm text-muted-foreground">
                      Família: {product.site_product_families.name}
                    </p>
                  )}
                  {product.product_format && (
                    <p className="text-sm text-muted-foreground">
                      Formato: {product.product_format}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(product)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {(product.cas_number || product.molecular_formula) && (
              <CardContent className="pt-0">
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {product.cas_number && (
                    <span>CAS: {product.cas_number}</span>
                  )}
                  {product.molecular_formula && (
                    <span>Fórmula: {product.molecular_formula}</span>
                  )}
                  {product.molecular_weight && (
                    <span>PM: {product.molecular_weight}</span>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <SiteProductsCSVImportModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImported={() => {
          refetch();
          toast.success('Produtos importados com sucesso!');
        }}
      />
    </div>
  );
};

export default SiteProducts;
