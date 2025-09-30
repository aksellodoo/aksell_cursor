import { useState } from 'react';
import { CustomFullscreenModal } from '@/components/ui/custom-fullscreen-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { ClientLinkingFlow } from './ClientLinkingFlow';
import { SupplierLinkingFlow } from './SupplierLinkingFlow';
import { RepresentativeLinkingFlow } from './RepresentativeLinkingFlow';
import { CarrierLinkingFlow } from './CarrierLinkingFlow';
import { PublicOrgLinkingFlow } from './PublicOrgLinkingFlow';
import { AssociationLinkingFlow } from './AssociationLinkingFlow';
import { ExternalPartnerLinkingFlow } from './ExternalPartnerLinkingFlow';
import { FriendsFamilyLinkingFlow } from './FriendsFamilyLinkingFlow';
import { CreateFriendFamilyLinkData } from '@/hooks/useFriendsFamilyLinks';

interface ContactLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (links: { link_type: 'cliente' | 'fornecedor' | 'representante' | 'entidade'; target_id: string; target_kind: string }[]) => void;
  onFriendsFamilyConfirm?: (data: CreateFriendFamilyLinkData) => Promise<void>;
}

type LinkType = 'clientes' | 'fornecedores' | 'representantes-comerciais' | 'transportadoras' | 'funcionarios-publicos' | 'associacoes-sindicatos' | 'parceiros-externos' | 'amigos-familiares';

const linkTypeOptions = [
  { value: 'clientes', label: 'Clientes', mappedType: 'cliente' as const },
  { value: 'fornecedores', label: 'Fornecedores / Prestadores de Serviço', mappedType: 'fornecedor' as const },
  { value: 'representantes-comerciais', label: 'Representantes Comerciais', mappedType: 'representante' as const },
  { value: 'transportadoras', label: 'Transportadoras', mappedType: 'entidade' as const },
  { value: 'funcionarios-publicos', label: 'Funcionários Públicos / Órgãos de Controle', mappedType: 'entidade' as const },
  { value: 'associacoes-sindicatos', label: 'Associações e Sindicatos', mappedType: 'entidade' as const },
  { value: 'parceiros-externos', label: 'Parceiros Externos', mappedType: 'entidade' as const },
  { value: 'amigos-familiares', label: 'Amigos e Familiares', mappedType: 'entidade' as const },
];

export function ContactLinkModal({ open, onOpenChange, onSave, onFriendsFamilyConfirm }: ContactLinkModalProps) {
  const [selectedLinkType, setSelectedLinkType] = useState<LinkType | ''>('');
  const [targetId, setTargetId] = useState('');

  const handleSave = () => {
    if (selectedLinkType && targetId) {
      const option = linkTypeOptions.find(opt => opt.value === selectedLinkType);
      if (option) {
        onSave([{
          link_type: option.mappedType,
          target_id: targetId,
          target_kind: 'unified_customer' // default for non-client types
        }]);
        handleCancel();
      }
    }
  };

  const handleCancel = () => {
    setSelectedLinkType('');
    setTargetId('');
    onOpenChange(false);
  };

  const handleClientLinksConfirm = (links: { link_type: 'cliente'; target_id: string; target_kind: string }[]) => {
    onSave(links);
    handleCancel();
  };

  const handleSupplierLinksConfirm = (links: { link_type: 'fornecedor'; target_id: string; target_kind: string }[]) => {
    onSave(links);
    handleCancel();
  };

  const handleRepresentativeLinksConfirm = (links: { link_type: 'representante'; target_id: string; target_kind: string }[]) => {
    onSave(links);
    handleCancel();
  };

  const handleCarrierLinksConfirm = (links: { link_type: 'entidade'; target_id: string; target_kind: 'carrier' }[]) => {
    onSave(links);
    handleCancel();
  };

  const handlePublicOrgLinksConfirm = (links: { link_type: 'entidade'; target_id: string; target_kind: 'public_org' }[]) => {
    onSave(links);
    handleCancel();
  };

  const handleAssociationLinksConfirm = (links: Array<{ link_type: string; target_id: string; target_kind: string }>) => {
    if (links.length > 0) {
      // Type cast to ensure compatibility 
      const typedLinks = links.map(link => ({
        ...link,
        link_type: link.link_type as 'cliente' | 'fornecedor' | 'representante' | 'entidade'
      }));
      onSave(typedLinks);
      handleCancel();
    }
  };

  const handleExternalPartnerLinksConfirm = (links: { link_type: 'entidade'; target_id: string; target_kind: 'external_partner' }[]) => {
    onSave(links);
    handleCancel();
  };

  return (
    <CustomFullscreenModal isOpen={open} onClose={handleCancel}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-semibold">Vincular Contato</h2>
            <p className="text-muted-foreground mt-1">
              Selecione o tipo de vínculo e configure os detalhes da vinculação.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="link_type">Tipo de Vínculo</Label>
              <Select value={selectedLinkType} onValueChange={(value: LinkType) => setSelectedLinkType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de vínculo" />
                </SelectTrigger>
                <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
                  {linkTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedLinkType === 'clientes' ? (
              <ClientLinkingFlow onConfirm={handleClientLinksConfirm} onCancel={handleCancel} />
            ) : selectedLinkType === 'fornecedores' ? (
              <SupplierLinkingFlow onConfirm={handleSupplierLinksConfirm} onCancel={handleCancel} />
            ) : selectedLinkType === 'representantes-comerciais' ? (
              <RepresentativeLinkingFlow onConfirm={handleRepresentativeLinksConfirm} onCancel={handleCancel} />
            ) : selectedLinkType === 'transportadoras' ? (
              <CarrierLinkingFlow onConfirm={handleCarrierLinksConfirm} onCancel={handleCancel} />
            ) : selectedLinkType === 'funcionarios-publicos' ? (
              <PublicOrgLinkingFlow onConfirm={handlePublicOrgLinksConfirm} onCancel={handleCancel} />
            ) : selectedLinkType === 'associacoes-sindicatos' ? (
              <AssociationLinkingFlow onConfirm={handleAssociationLinksConfirm} onCancel={handleCancel} />
            ) : selectedLinkType === 'parceiros-externos' ? (
              <ExternalPartnerLinkingFlow onConfirm={handleExternalPartnerLinksConfirm} onCancel={handleCancel} />
            ) : selectedLinkType === 'amigos-familiares' ? (
              <FriendsFamilyLinkingFlow 
                onConfirm={async (data) => {
                  if (onFriendsFamilyConfirm) {
                    await onFriendsFamilyConfirm(data);
                  }
                  handleCancel();
                }}
                onCancel={handleCancel}
              />
            ) : selectedLinkType ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="target_id">ID do Registro</Label>
                  <Input
                    id="target_id"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    placeholder="Digite o ID do registro para vincular"
                  />
                  <p className="text-xs text-muted-foreground">
                    Insira o identificador único do registro que deseja vincular a este contato.
                  </p>
                </div>

                <div className="flex gap-4 justify-end pt-4">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={!targetId}>
                    Vincular
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </CustomFullscreenModal>
  );
}