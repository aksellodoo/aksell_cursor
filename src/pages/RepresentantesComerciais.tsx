import { CommercialRepresentativesList } from '@/components/CommercialRepresentativesList';
import { CustomFullscreenModal } from '@/components/ui/custom-fullscreen-modal';
import { Button } from '@/components/ui/button';
import { X, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RepresentantesComerciais = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/dashboard');
  };

  return (
    <CustomFullscreenModal
      isOpen={true}
      onClose={handleClose}
      className="bg-background"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-card">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Representantes Comerciais</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie representantes comerciais de vendas
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <CommercialRepresentativesList context="sales" />
        </div>
      </div>
    </CustomFullscreenModal>
  );
};

export default RepresentantesComerciais;