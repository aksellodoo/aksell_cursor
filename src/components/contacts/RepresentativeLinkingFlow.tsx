import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useCommercialRepresentatives, type CommercialRepresentative } from '@/hooks/useCommercialRepresentatives';
import { CommercialRepresentativeModal } from '@/components/CommercialRepresentativeModal';
import { Search, Plus } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface RepresentativeLinkingFlowProps {
  onConfirm: (links: { link_type: 'representante'; target_id: string; target_kind: string }[]) => void;
  onCancel: () => void;
}

export function RepresentativeLinkingFlow({ onConfirm, onCancel }: RepresentativeLinkingFlowProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRepresentativeId, setSelectedRepresentativeId] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { listQuery } = useCommercialRepresentatives();
  
  const { data: allRepresentatives, isLoading } = listQuery;

  // Filter representatives based on search term
  const filteredRepresentatives = useMemo(() => {
    if (!allRepresentatives || !debouncedSearchTerm) {
      return allRepresentatives || [];
    }

    const term = debouncedSearchTerm.toLowerCase();
    
    return allRepresentatives.filter(rep => {
      // Search by company name
      if (rep.company_name.toLowerCase().includes(term)) {
        return true;
      }

      // Search by type keywords
      if (term.includes('vendas') || term.includes('venda')) {
        return rep.is_sales;
      }
      
      if (term.includes('compras') || term.includes('compra')) {
        return rep.is_purchases;
      }

      // Search by Protheus codes (remove punctuation for flexible matching)
      const cleanTerm = term.replace(/[^a-z0-9]/g, '');
      if (cleanTerm.length >= 3) {
        // Check supplier_filial
        if (rep.supplier_filial && rep.supplier_filial.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanTerm)) {
          return true;
        }
        
        // Check supplier_cod
        if (rep.supplier_cod && rep.supplier_cod.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanTerm)) {
          return true;
        }
        
        // Check supplier_loja
        if (rep.supplier_loja && rep.supplier_loja.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanTerm)) {
          return true;
        }
        
        // Check supplier_key
        if (rep.supplier_key && rep.supplier_key.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanTerm)) {
          return true;
        }
        
        // Check concatenated code (filial/cod/loja)
        if (rep.supplier_filial && rep.supplier_cod && rep.supplier_loja) {
          const concatenated = `${rep.supplier_filial}${rep.supplier_cod}${rep.supplier_loja}`.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (concatenated.includes(cleanTerm)) {
            return true;
          }
        }
      }

      return false;
    });
  }, [allRepresentatives, debouncedSearchTerm]);

  const handleConfirm = () => {
    if (selectedRepresentativeId) {
      onConfirm([{
        link_type: 'representante',
        target_id: selectedRepresentativeId,
        target_kind: 'commercial_representative'
      }]);
    }
  };

  const handleRepresentativeCreated = (createdRepresentative: CommercialRepresentative) => {
    setIsCreateModalOpen(false);
    setSelectedRepresentativeId(createdRepresentative.id);
  };

  const getRepresentativeTypeBadges = (rep: CommercialRepresentative) => {
    const badges = [];
    if (rep.is_sales && rep.is_purchases) {
      badges.push(<Badge key="both" variant="secondary" className="text-xs">Vendas + Compras</Badge>);
    } else {
      if (rep.is_sales) {
        badges.push(<Badge key="sales" variant="customer" className="text-xs">Vendas</Badge>);
      }
      if (rep.is_purchases) {
        badges.push(<Badge key="purchases" variant="supplier" className="text-xs">Compras</Badge>);
      }
    }
    return badges;
  };

  const getProtheusCode = (rep: CommercialRepresentative) => {
    if (rep.supplier_filial && rep.supplier_cod && rep.supplier_loja) {
      return `${rep.supplier_filial}/${rep.supplier_cod}/${rep.supplier_loja}`;
    }
    if (rep.supplier_key) {
      return rep.supplier_key;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rep-search">Buscar Representante Comercial</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="rep-search"
              placeholder="Digite o nome, tipo (vendas/compras) ou código Protheus..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Busque por nome da empresa, "vendas", "compras" ou códigos Protheus (ex: 01/002/001)
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Selecione um Representante</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Cadastrar representante comercial
              </Button>
            </div>
            
            {filteredRepresentatives.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {debouncedSearchTerm ? 'Nenhum representante encontrado para a busca.' : 'Digite algo para buscar representantes.'}
              </div>
            ) : (
              <RadioGroup value={selectedRepresentativeId} onValueChange={setSelectedRepresentativeId}>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredRepresentatives.map((rep) => {
                    const protheusCode = getProtheusCode(rep);
                    
                    return (
                      <div
                        key={rep.id}
                        className="flex items-center space-x-3 p-3 rounded border hover:bg-accent cursor-pointer"
                        onClick={() => setSelectedRepresentativeId(rep.id)}
                      >
                        <RadioGroupItem value={rep.id} id={`rep-${rep.id}`} />
                        <Label htmlFor={`rep-${rep.id}`} className="cursor-pointer flex-1">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{rep.company_name}</span>
                              {getRepresentativeTypeBadges(rep)}
                            </div>
                            {protheusCode && (
                              <div className="text-xs text-muted-foreground">
                                Código Protheus: {protheusCode}
                              </div>
                            )}
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-4 justify-end pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleConfirm} disabled={!selectedRepresentativeId}>
          Vincular
        </Button>
      </div>

      <CommercialRepresentativeModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleRepresentativeCreated}
        context="purchases"
      />
    </div>
  );
}