import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { CityCombobox } from '@/components/CityCombobox';
import { useContactEntities } from '@/hooks/useContactEntities';
import { usePublicOrgDetails } from '@/hooks/usePublicOrgDetails';
import { toast } from 'sonner';

interface PublicOrgEntityCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (entityId: string) => void;
}

export function PublicOrgEntityCreateModal({ 
  open, 
  onOpenChange, 
  onSuccess 
}: PublicOrgEntityCreateModalProps) {
  const [officialName, setOfficialName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [cityId, setCityId] = useState('');
  const [loading, setLoading] = useState(false);

  const { createEntity } = useContactEntities();
  const { upsert: upsertPublicOrgDetails } = usePublicOrgDetails();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!officialName.trim()) {
      toast.error('Nome oficial é obrigatório');
      return;
    }

    setLoading(true);
    try {
      // Create the contact entity
      const entity = await createEntity({
        type: 'orgaos_publicos_controle',
        name: officialName.trim()
      });

      if (!entity) {
        throw new Error('Falha ao criar entidade');
      }

      // Create the public org details
      await upsertPublicOrgDetails({
        contact_entity_id: entity.id,
        official_name: officialName.trim(),
        cnpj: cnpj.trim() || undefined,
        city_id: cityId || undefined
      });

      toast.success('Órgão público criado com sucesso');
      onSuccess(entity.id);
      handleClose();
    } catch (error) {
      console.error('Error creating public org:', error);
      toast.error('Erro ao criar órgão público');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOfficialName('');
    setCnpj('');
    setCityId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Cadastrar Órgão Público</DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="official_name">Nome Oficial *</Label>
            <Input
              id="official_name"
              value={officialName}
              onChange={(e) => setOfficialName(e.target.value)}
              placeholder="Ex: Prefeitura Municipal de São Paulo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              placeholder="00.000.000/0000-00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <CityCombobox
              value={cityId}
              onValueChange={setCityId}
              placeholder="Selecione a cidade"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !officialName.trim()}>
              {loading ? 'Criando...' : 'Criar Órgão'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}