import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, Eye } from 'lucide-react';

interface PendingTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: 'revisao' | 'aprovacao') => void;
}

export const PendingTypeModal: React.FC<PendingTypeModalProps> = ({
  isOpen,
  onClose,
  onSelectType
}) => {
  const handleSelectRevisao = () => {
    onSelectType('revisao');
    onClose();
  };

  const handleSelectAprovacao = () => {
    onSelectType('aprovacao');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tipo de Pendência</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-foreground text-center mb-6">
            O documento ficará pendente para qual processo?
          </p>

          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={handleSelectRevisao}
              className="w-full justify-start gap-3 h-auto p-4 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700"
            >
              <Eye className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">Revisão</div>
                <div className="text-sm text-muted-foreground">
                  Documento precisa ser revisado antes da aprovação
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={handleSelectAprovacao}
              className="w-full justify-start gap-3 h-auto p-4 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700"
            >
              <ClipboardCheck className="h-5 w-5 text-green-600" />
              <div className="text-left">
                <div className="font-medium">Aprovação</div>
                <div className="text-sm text-muted-foreground">
                  Documento vai direto para aprovação final
                </div>
              </div>
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};