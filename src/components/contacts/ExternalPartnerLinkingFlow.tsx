import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Building2 } from 'lucide-react';
import { CustomFullscreenModal } from '@/components/ui/custom-fullscreen-modal';
import { useExternalPartnerEntitiesSearch } from '@/hooks/useExternalPartnerEntitiesSearch';

interface ExternalPartnerLinkingFlowProps {
  onConfirm: (links: { link_type: 'entidade'; target_id: string; target_kind: 'external_partner' }[]) => void;
  onCancel: () => void;
}

export const ExternalPartnerLinkingFlow: React.FC<ExternalPartnerLinkingFlowProps> = ({
  onConfirm,
  onCancel
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { 
    entities, 
    loading, 
    error, 
    hasMore, 
    search, 
    loadMore, 
    refetch 
  } = useExternalPartnerEntitiesSearch();

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    search(searchTerm);
  }, [searchTerm, search]);

  // Handle iframe modal messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security check for origin
      if (event.origin && event.origin !== window.location.origin) return;
      
      const type = event.data?.type;
      if ((type === 'entity-created' || type === 'ENTITY_CREATED') && event.data?.entityId) {
        setSelectedEntityId(event.data.entityId);
        setIsCreateModalOpen(false);
        refetch(); // Refresh the list
      } else if (type === 'close-modal' || type === 'CLOSE_MODAL') {
        setIsCreateModalOpen(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refetch]);

  const handleEntitySelect = (entityId: string) => {
    setSelectedEntityId(entityId);
  };

  const handleConfirm = () => {
    if (!selectedEntityId) return;
    
    const selectedEntity = entities.find(e => e.entity_id === selectedEntityId);
    if (selectedEntity) {
      onConfirm([{
        link_type: 'entidade',
        target_id: selectedEntity.entity_id,
        target_kind: 'external_partner'
      }]);
    }
  };

  // Format CNPJ
  const formatCNPJ = (cnpj?: string) => {
    if (!cnpj) return '';
    const digits = cnpj.replace(/\D/g, '');
    if (digits.length !== 14) return cnpj;
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar parceiros externos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Create Entity Button */}
      <Button
        variant="outline"
        onClick={() => setIsCreateModalOpen(true)}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Cadastrar Entidade
      </Button>

      {/* Results */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {loading && (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-4">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {!loading && !error && entities.length === 0 && (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'Nenhum parceiro externo encontrado' : 'Nenhum parceiro externo cadastrado'}
            </p>
          </div>
        )}

        {entities.map((entity) => (
          <Card
            key={entity.id}
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
              selectedEntityId === entity.entity_id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleEntitySelect(entity.entity_id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">
                      {entity.official_name}
                    </h3>
                    {selectedEntityId === entity.entity_id && (
                      <Badge variant="default" className="text-xs">
                        Selecionado
                      </Badge>
                    )}
                  </div>
                  
                  {entity.trade_name && (
                    <p className="text-sm text-muted-foreground mb-1">
                      {entity.trade_name}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {entity.cnpj && (
                      <span>{formatCNPJ(entity.cnpj)}</span>
                    )}
                    {entity.city_label && (
                      <span>{entity.city_label}</span>
                    )}
                  </div>

                  {entity.partner_type && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {entity.partner_type}
                      </Badge>
                    </div>
                  )}

                  {entity.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {entity.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {hasMore && !loading && (
          <Button
            variant="outline"
            onClick={loadMore}
            className="w-full"
          >
            Carregar mais
          </Button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button 
          onClick={handleConfirm} 
          disabled={!selectedEntityId}
          className="flex-1"
        >
          Vincular
        </Button>
      </div>

      {/* Create Entity Modal */}
      <CustomFullscreenModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      >
        <iframe
          src="/gestao/contatos/entidades?modal=create&type=parceiros_externos"
          className="w-full h-full border-0"
          title="Cadastrar Entidade"
        />
      </CustomFullscreenModal>
    </div>
  );
};