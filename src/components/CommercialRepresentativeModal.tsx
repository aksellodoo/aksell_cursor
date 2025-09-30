
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useCommercialRepresentatives } from '@/hooks/useCommercialRepresentatives';
import { ProtheusSupplierPicker } from '@/components/ProtheusSupplierPicker';
import { PROTHEUS_TABLES } from '@/lib/config';
import { toast } from 'sonner';

interface CommercialRepresentativeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: 'sales' | 'purchases';
  onSuccess?: (createdRepresentative: any) => void;
}

export const CommercialRepresentativeModal: React.FC<CommercialRepresentativeModalProps> = ({
  open,
  onOpenChange,
  context,
  onSuccess
}) => {
  const { createMutation } = useCommercialRepresentatives();
  
  const [formData, setFormData] = useState({
    company_name: '',
    is_sales: context === 'sales',
    is_purchases: context === 'purchases',
    is_registered_in_protheus: false,
    notes: ''
  });

  const [isSupplierPickerOpen, setIsSupplierPickerOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  const handleSupplierSelect = (supplier: any) => {
    setSelectedSupplier(supplier);
    setIsSupplierPickerOpen(false);
  };

  const handleClearSupplier = () => {
    setSelectedSupplier(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_name.trim()) {
      toast.error('Nome da empresa é obrigatório');
      return;
    }

    if (formData.is_registered_in_protheus && !selectedSupplier) {
      toast.error('Selecione um fornecedor do Protheus');
      return;
    }

    try {
      const payload: any = {
        company_name: formData.company_name.trim(),
        is_sales: formData.is_sales,
        is_purchases: formData.is_purchases,
        is_registered_in_protheus: formData.is_registered_in_protheus,
        notes: formData.notes.trim() || undefined
      };

      if (formData.is_registered_in_protheus && selectedSupplier) {
        payload.protheus_table_id = PROTHEUS_TABLES.SA2010_FORNECEDORES;
        payload.supplier_filial = selectedSupplier.filial;
        payload.supplier_cod = selectedSupplier.cod;
        payload.supplier_loja = selectedSupplier.loja;
      }

      const createdRepresentative = await createMutation.mutateAsync(payload);

      // Reset form
      setFormData({
        company_name: '',
        is_sales: context === 'sales',
        is_purchases: context === 'purchases',
        is_registered_in_protheus: false,
        notes: ''
      });
      setSelectedSupplier(null);

      toast.success('Representante comercial criado com sucesso!');
      onOpenChange(false);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(createdRepresentative);
      }
    } catch (error) {
      console.error('Error creating representative:', error);
      toast.error('Erro ao criar representante comercial');
    }
  };

  const handleClose = () => {
    setFormData({
      company_name: '',
      is_sales: context === 'sales',
      is_purchases: context === 'purchases',
      is_registered_in_protheus: false,
      notes: ''
    });
    setSelectedSupplier(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Novo Representante Comercial
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">
              Nome da Empresa *
            </Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
              placeholder="Digite o nome da empresa representante"
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Tipo de Representação</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_sales"
                  checked={formData.is_sales}
                  disabled={context === 'sales'}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, is_sales: checked as boolean }))
                  }
                />
                <Label htmlFor="is_sales">Vendas</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_purchases"
                  checked={formData.is_purchases}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, is_purchases: checked as boolean }))
                  }
                />
                <Label htmlFor="is_purchases">Compras</Label>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_registered_in_protheus"
              checked={formData.is_registered_in_protheus}
              onCheckedChange={(checked) => {
                setFormData(prev => ({ ...prev, is_registered_in_protheus: checked as boolean }));
                if (!checked) {
                  setSelectedSupplier(null);
                }
              }}
            />
            <Label htmlFor="is_registered_in_protheus">
              Registrado no Protheus
            </Label>
          </div>

          {formData.is_registered_in_protheus && (
            <div className="space-y-2">
              <Label>Fornecedor no Protheus *</Label>
              {selectedSupplier ? (
                <div className="p-3 bg-secondary rounded-md space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{selectedSupplier.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        Filial: {selectedSupplier.filial} | Código: {selectedSupplier.cod} | Loja: {selectedSupplier.loja}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearSupplier}
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSupplierPickerOpen(true)}
                  className="w-full"
                >
                  Selecionar Fornecedor
                </Button>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações adicionais (opcional)"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={
                createMutation.isPending || 
                !formData.company_name.trim() || 
                (!formData.is_sales && !formData.is_purchases) ||
                (formData.is_registered_in_protheus && !selectedSupplier)
              }
            >
              {createMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>

      {isSupplierPickerOpen && (
        <ProtheusSupplierPicker
          open={isSupplierPickerOpen}
          onOpenChange={setIsSupplierPickerOpen}
          onSelect={handleSupplierSelect}
          selectedSupplier={selectedSupplier}
        />
      )}
    </Dialog>
  );
};
