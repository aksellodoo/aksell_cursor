import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ObsoleteReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHasReplacement: () => void;
  onNoReplacement: () => void;
}

export const ObsoleteReasonModal: React.FC<ObsoleteReasonModalProps> = ({
  isOpen,
  onClose,
  onHasReplacement,
  onNoReplacement
}) => {
  const handleHasReplacement = () => {
    onHasReplacement();
    onClose();
  };

  const handleNoReplacement = () => {
    onNoReplacement();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Documento Obsoleto</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-foreground text-center">
            O arquivo tem substituto?
          </p>
        </div>

        <DialogFooter className="flex justify-center space-x-4">
          <Button variant="outline" onClick={handleNoReplacement}>
            Não
          </Button>
          <Button onClick={handleHasReplacement}>
            Sim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};