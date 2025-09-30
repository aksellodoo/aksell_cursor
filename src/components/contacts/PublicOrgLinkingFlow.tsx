import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CustomFullscreenModal } from '@/components/ui/custom-fullscreen-modal';
import { Search, Plus, Loader2 } from 'lucide-react';
import { usePublicOrgEntitiesSearch, type PublicOrgEntitySearchResult } from '@/hooks/usePublicOrgEntitiesSearch';

interface PublicOrgLinkingFlowProps {
  onConfirm: (links: { link_type: 'entidade'; target_id: string; target_kind: 'public_org' }[]) => void;
  onCancel: () => void;
}

export function PublicOrgLinkingFlow({ onConfirm, onCancel }: PublicOrgLinkingFlowProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    entities,
    loading,
    search,
    refetch,
    hasMore,
    loadMore,
    totalCount
  } = usePublicOrgEntitiesSearch();

  // Handle search input changes
  useEffect(() => {
    search(searchTerm);
  }, [searchTerm, search]);

  const handleEntitySelect = (entity: PublicOrgEntitySearchResult) => {
    setSelectedEntityId(entity.entity_id);
  };

  const handleConfirm = () => {
    if (selectedEntityId) {
      onConfirm([{
        link_type: 'entidade',
        target_id: selectedEntityId,
        target_kind: 'public_org'
      }]);
    }
  };

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

  const formatCNPJ = (cnpj?: string) => {
    if (!cnpj) return '';
    const digits = cnpj.replace(/[^0-9]/g, '');
    if (digits.length === 14) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
    }
    return cnpj;
  };

  return (
    <div className="space-y-4">
      {/* Search Section */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 space-y-2">
            <Label htmlFor="search">Buscar Órgãos Públicos</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome oficial, CNPJ, cidade ou tags..."
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(true)}
              className="whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Entidade
            </Button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="text-sm text-muted-foreground">
          {loading ? (
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Carregando órgãos públicos...
            </div>
          ) : (
            `${totalCount} órgão${totalCount !== 1 ? 's' : ''} público${totalCount !== 1 ? 's' : ''} encontrado${totalCount !== 1 ? 's' : ''}`
          )}
        </div>
      </div>

      {/* Entity List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {entities.map((entity) => (
          <Card 
            key={entity.id}
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
              selectedEntityId === entity.entity_id ? 'ring-2 ring-primary bg-muted/30' : ''
            }`}
            onClick={() => handleEntitySelect(entity)}
          >
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <h4 className="font-medium text-sm leading-tight">
                      {entity.official_name}
                    </h4>
                    {entity.entity_name !== entity.official_name && (
                      <p className="text-xs text-muted-foreground">
                        {entity.entity_name}
                      </p>
                    )}
                  </div>
                  {selectedEntityId === entity.entity_id && (
                    <Badge variant="default" className="ml-2">
                      Selecionado
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {entity.cnpj && (
                    <span>CNPJ: {formatCNPJ(entity.cnpj)}</span>
                  )}
                  {entity.city_label && (
                    <span>📍 {entity.city_label}</span>
                  )}
                </div>

                {entity.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {entity.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center pt-2">
            <Button variant="outline" onClick={loadMore} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Carregando...
                </>
              ) : (
                'Carregar mais'
              )}
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && entities.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum órgão público encontrado.</p>
            <p className="text-sm mt-1">
              Utilize o botão "Cadastrar Entidade" para criar um novo registro.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          onClick={handleConfirm} 
          disabled={!selectedEntityId}
        >
          Vincular
        </Button>
      </div>

      {/* Create Modal */}
      <CustomFullscreenModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      >
        <iframe
          src="/gestao/contatos/entidades?modal=create&type=orgaos_publicos_controle"
          className="w-full h-full border-0"
          title="Cadastrar Entidade"
        />
      </CustomFullscreenModal>
    </div>
  );
}