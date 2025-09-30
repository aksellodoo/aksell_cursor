import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Download, FileText } from 'lucide-react';

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  signedUrl: string;
  onDownload: () => void;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  isOpen,
  onClose,
  documentName,
  signedUrl,
  onDownload
}) => {
  const handleOpenInNewTab = () => {
    window.open(signedUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Visualizar PDF
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            <strong>{documentName}</strong>
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <p className="text-sm text-muted-foreground">
            O documento será aberto em uma nova aba do navegador para melhor experiência de visualização.
          </p>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleOpenInNewTab}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir PDF em Nova Aba
            </Button>

            <Button 
              variant="outline"
              onClick={onDownload}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Documento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};