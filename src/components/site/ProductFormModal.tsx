import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/LoadingSpinner';

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
  updated_at?: string;
  group_id?: string;
}

interface Family {
  id: string;
  name: string;
  name_en: string;
  is_active: boolean;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSuccess: () => void;
}

export const ProductFormModal = ({ isOpen, onClose, product, onSuccess }: ProductFormModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [families, setFamilies] = useState<Family[]>([]);
  const [productNames, setProductNames] = useState<any[]>([]);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    name_en: null,
    name_id: null,
    family_id: null,
    compound_type: null,
    compound_type_en: null,
    molecular_formula: null,
    molecular_weight: null,
    product_format: null,
    cas_number: null,
    cas_note: null,
    cas_note_en: null,
    is_active: true,
  });

  // Load families and product names on mount
  useEffect(() => {
    if (isOpen) {
      loadFormData();
    }
  }, [isOpen]);

  // Set form data when product changes
  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      setFormData({
        name: '',
        name_en: null,
        name_id: null,
        family_id: null,
        compound_type: null,
        compound_type_en: null,
        molecular_formula: null,
        molecular_weight: null,
        product_format: null,
        cas_number: null,
        cas_note: null,
        cas_note_en: null,
        is_active: true,
      });
    }
  }, [product]);

  const loadFormData = async () => {
    try {
      // Load families
      const { data: familiesData } = await supabase
        .from('site_product_families')
        .select('*')
        .eq('is_active', true)
        .order('name');

      // Load product names
      const { data: namesData } = await supabase
        .from('site_product_names')
        .select('*')
        .order('name');

      if (familiesData) setFamilies(familiesData);
      if (namesData) setProductNames(namesData);
    } catch (error) {
      console.error('Erro ao carregar dados do formulário:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (product?.id) {
        // Update existing product
        const { error } = await supabase
          .from('site_products')
          .update(formData)
          .eq('id', product.id);

        if (error) throw error;

        toast({
          title: "Produto atualizado",
          description: "O produto foi atualizado com sucesso.",
        });
      } else {
        // Create new product - validate required fields
        if (!formData.name) {
          throw new Error('Nome é obrigatório');
        }
        
        const { error } = await supabase
          .from('site_products')
          .insert([{
            ...formData,
            name: formData.name,
            created_by: user?.id || ''
          }]);

        if (error) throw error;

        toast({
          title: "Produto criado",
          description: "O produto foi criado com sucesso.",
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar produto.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="name_en">Nome (EN)</Label>
              <Input
                id="name_en"
                value={formData.name_en || ''}
                onChange={(e) => handleInputChange('name_en', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name_id">Nome Base</Label>
              <Select
                value={formData.name_id || ''}
                onValueChange={(value) => handleInputChange('name_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um nome base" />
                </SelectTrigger>
                <SelectContent>
                  {productNames.map((name) => (
                    <SelectItem key={name.id} value={name.id}>
                      {name.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="family_id">Família</Label>
              <Select
                value={formData.family_id || ''}
                onValueChange={(value) => handleInputChange('family_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma família" />
                </SelectTrigger>
                <SelectContent>
                  {families.map((family) => (
                    <SelectItem key={family.id} value={family.id}>
                      {family.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="compound_type">Tipo de Composto</Label>
              <Input
                id="compound_type"
                value={formData.compound_type || ''}
                onChange={(e) => handleInputChange('compound_type', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="compound_type_en">Tipo de Composto (EN)</Label>
              <Input
                id="compound_type_en"
                value={formData.compound_type_en || ''}
                onChange={(e) => handleInputChange('compound_type_en', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="molecular_formula">Fórmula Molecular</Label>
              <Input
                id="molecular_formula"
                value={formData.molecular_formula || ''}
                onChange={(e) => handleInputChange('molecular_formula', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="molecular_weight">Peso Molecular</Label>
              <Input
                id="molecular_weight"
                type="number"
                step="0.01"
                value={formData.molecular_weight || ''}
                onChange={(e) => handleInputChange('molecular_weight', parseFloat(e.target.value) || null)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product_format">Formato do Produto</Label>
              <Select
                value={formData.product_format || ''}
                onValueChange={(value) => handleInputChange('product_format', value)}
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
              />
            </div>
          </div>

          <div>
            <Label htmlFor="cas_note">Nota CAS</Label>
            <Textarea
              id="cas_note"
              value={formData.cas_note || ''}
              onChange={(e) => handleInputChange('cas_note', e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="cas_note_en">Nota CAS (EN)</Label>
            <Textarea
              id="cas_note_en"
              value={formData.cas_note_en || ''}
              onChange={(e) => handleInputChange('cas_note_en', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
            <Label htmlFor="is_active">Produto Ativo</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <LoadingSpinner className="mr-2 h-4 w-4" />}
              {product ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};