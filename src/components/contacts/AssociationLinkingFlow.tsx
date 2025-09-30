import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus } from 'lucide-react';
import { useAssociationEntitiesSearch, type AssociationEntitySearchResult } from '@/hooks/useAssociationEntitiesSearch';
import { useDebounce } from '@/hooks/useDebounce';
import { CustomFullscreenModal } from '@/components/ui/custom-fullscreen-modal';

interface AssociationLinkingFlowProps {
  onConfirm: (links: Array<{ link_type: string; target_id: string; target_kind: string }>) => void;
  onCancel: () => void;
}

export function AssociationLinkingFlow({ onConfirm, onCancel }: AssociationLinkingFlowProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<AssociationEntitySearchResult | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const debouncedSearch = useDebounce(searchTerm, 300);
  const { results, loading, hasMore, search, loadMore } = useAssociationEntitiesSearch();

  // Executar busca quando o termo mudar
  useEffect(() => {
    search(debouncedSearch, true);
  }, [debouncedSearch, search]);

  const handleConfirm = () => {
    if (!selectedEntity) return;
    
    onConfirm([{
      link_type: 'entidade',
      target_id: selectedEntity.entity_id,
      target_kind: 'association_union'
    }]);
  };

  const handleEntityCreated = async (entityId: string) => {
    setShowCreateModal(false);
    // Refazer busca preservando o termo atual
    await search(searchTerm, true);
    // Selecionar a entidade recém-criada
    setTimeout(() => {
      const newEntity = results.find(r => r.entity_id === entityId);
      if (newEntity) {
        setSelectedEntity(newEntity);
      }
    }, 500);
  };

  // Handle opening the create modal
  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
  };

  const formatCNPJ = (cnpj?: string) => {
    if (!cnpj) return '';
    const digits = cnpj.replace(/\D/g, '');
    if (digits.length === 14) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
    }
    return cnpj;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar Associações e Sindicatos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleOpenCreateModal}
          className="shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Cadastrar Entidade
        </Button>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-2">
        {loading && results.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Carregando...
          </div>
        )}

        {!loading && results.length === 0 && searchTerm && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma associação encontrada para "{searchTerm}"
          </div>
        )}
        
        {!loading && results.length === 0 && !searchTerm && (
          <div className="text-center py-8 text-muted-foreground">
            Buscando associações e sindicatos...
          </div>
        )}

        {results.map((entity) => (
          <div
            key={entity.id}
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              selectedEntity?.id === entity.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setSelectedEntity(entity)}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{entity.official_name}</h4>
                  {entity.acronym && (
                    <p className="text-sm text-muted-foreground">
                      Sigla: {entity.acronym}
                    </p>
                  )}
                </div>
              </div>

              {entity.cnpj && (
                <p className="text-sm text-muted-foreground">
                  CNPJ: {formatCNPJ(entity.cnpj)}
                </p>
              )}

              {entity.city_label && (
                <p className="text-sm text-muted-foreground">
                  📍 {entity.city_label}
                </p>
              )}

              <div className="flex flex-wrap gap-1">
                {entity.association_type && (
                  <Badge variant="outline" className="text-xs">
                    {entity.association_type}
                  </Badge>
                )}
                {entity.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {entity.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{entity.tags.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}

        {hasMore && (
          <div className="text-center py-4">
            <Button
              type="button"
              variant="outline"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? 'Carregando...' : 'Carregar mais'}
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button 
          onClick={handleConfirm}
          disabled={!selectedEntity}
          className="flex-1"
        >
          Confirmar Vínculo
        </Button>
      </div>

      <CustomFullscreenModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <iframe 
          src="/gestao/contatos/entidades?modal=create&type=associacoes_sindicatos" 
          className="w-full h-full border-0"
          title="Criar Entidade"
          onLoad={() => {
            // Listen for messages from the iframe
            const handleMessage = (event: MessageEvent) => {
              if (event.origin !== window.location.origin) return;
              
              if (event.data?.type === 'entity-created' && event.data?.entityId) {
                handleEntityCreated(event.data.entityId);
                window.removeEventListener('message', handleMessage);
              }
              if (event.data?.type === 'close-modal') {
                setShowCreateModal(false);
                window.removeEventListener('message', handleMessage);
              }
            };
            window.addEventListener('message', handleMessage);
          }}
        />
      </CustomFullscreenModal>
    </div>
  );
}