
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCommercialRepresentatives, CommercialRepresentative } from '@/hooks/useCommercialRepresentatives';
import { CommercialRepresentativeModal } from '@/components/CommercialRepresentativeModal';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface RepresentativeSelectorProps {
  value?: string;
  onValueChange: (representativeId: string | undefined) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  context?: 'sales' | 'purchases';
}

export const RepresentativeSelector = ({
  value,
  onValueChange,
  label = "Representante Comercial",
  placeholder = "Selecione um representante...",
  required = false,
  context = 'sales'
}: RepresentativeSelectorProps) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { listQuery } = useCommercialRepresentatives(context);

  const handleValueChange = (representativeId: string | undefined) => {
    onValueChange(representativeId);
  };

  const handleRepresentativeCreated = (createdRepresentative: CommercialRepresentative) => {
    // A lista será atualizada automaticamente pelo React Query
    setShowCreateModal(false);
    // Auto-select the newly created representative
    onValueChange(createdRepresentative.id);
  };

  if (listQuery.isLoading) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-2 p-2">
          <LoadingSpinner text="Carregando representantes..." />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">
            {label} {required && '*'}
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="h-6 px-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Novo representante
          </Button>
        </div>
        
        <Select value={value || ''} onValueChange={handleValueChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
            {listQuery.data?.length === 0 ? (
              <SelectItem value="no-results" disabled>
                {context === 'sales' ? 'Nenhum representante de vendas encontrado' : 'Nenhum representante de compras encontrado'}
              </SelectItem>
            ) : (
              listQuery.data?.map((representative) => (
                <SelectItem key={representative.id} value={representative.id}>
                  {representative.company_name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {listQuery.error && (
          <p className="text-xs text-red-600">
            Erro ao carregar representantes: {listQuery.error.message}
          </p>
        )}
      </div>

      <CommercialRepresentativeModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        context={context}
        onSuccess={handleRepresentativeCreated}
      />
    </>
  );
};
