import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CitySelector } from '@/components/CitySelector';
import { useContactEntities } from '@/hooks/useContactEntities';
import { useAssociationDetails } from '@/hooks/useAssociationDetails';
import { toast } from 'sonner';

interface AssociationEntityCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (entityId: string) => void;
}

const associationTypes = [
  { value: 'sindicato', label: 'Sindicato' },
  { value: 'associacao', label: 'Associação' },
  { value: 'federacao', label: 'Federação' },
  { value: 'confederacao', label: 'Confederação' },
  { value: 'cooperativa', label: 'Cooperativa' },
  { value: 'outro', label: 'Outro' }
];

export function AssociationEntityCreateModal({ 
  open, 
  onOpenChange, 
  onSuccess 
}: AssociationEntityCreateModalProps) {
  const [formData, setFormData] = useState({
    official_name: '',
    acronym: '',
    cnpj: '',
    city_id: '',
    association_type: ''
  });
  const [loading, setLoading] = useState(false);

  const { createEntity } = useContactEntities();
  const { upsert } = useAssociationDetails();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.official_name.trim()) {
      toast.error('Nome oficial é obrigatório');
      return;
    }

    try {
      setLoading(true);

      // Criar entidade
      const entity = await createEntity({
        type: 'associacoes_sindicatos',
        name: formData.official_name
      });

      // Criar detalhes da associação
      await upsert({
        contact_entity_id: entity.id,
        official_name: formData.official_name,
        acronym: formData.acronym || undefined,
        cnpj: formData.cnpj || undefined,
        city_id: formData.city_id || undefined,
        association_type: formData.association_type || undefined
      });

      toast.success('Associação criada com sucesso!');
      onSuccess(entity.id);
      onOpenChange(false);
      
      // Reset form
      setFormData({
        official_name: '',
        acronym: '',
        cnpj: '',
        city_id: '',
        association_type: ''
      });
    } catch (error) {
      console.error('Erro ao criar associação:', error);
      toast.error('Erro ao criar associação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar Associação/Sindicato</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="official_name">Nome Oficial *</Label>
            <Input
              id="official_name"
              value={formData.official_name}
              onChange={(e) => setFormData(prev => ({ ...prev, official_name: e.target.value }))}
              placeholder="Digite o nome oficial"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="acronym">Sigla</Label>
            <Input
              id="acronym"
              value={formData.acronym}
              onChange={(e) => setFormData(prev => ({ ...prev, acronym: e.target.value }))}
              placeholder="Ex: FIESP, SINDIPAN"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              value={formData.cnpj}
              onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
              placeholder="00.000.000/0000-00"
            />
          </div>

          <div className="space-y-2">
            <Label>Cidade</Label>
            <CitySelector
              value={formData.city_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, city_id: value }))}
              placeholder="Selecione a cidade"
              label="Cidade"
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={formData.association_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, association_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {associationTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Criando...' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}