import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Monitor, Code, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PDFViewerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  signedUrl: string;
  documentId: string;
}

export const PDFViewerSelectionModal: React.FC<PDFViewerSelectionModalProps> = ({
  isOpen,
  onClose,
  documentName,
  signedUrl,
  documentId
}) => {
  const visualizarOnlyOffice = async (documentId: string) => {
    try {
      console.log('🔄 Iniciando visualização OnlyOffice para documento:', documentId);
      
      // Verificar se o usuário está autenticado
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }
      
      console.log('✅ Usuário autenticado, chamando função view-doc...');
      
      const { data, error } = await supabase.functions.invoke('view-doc', {
        body: { 
          id: documentId, 
          viewer: 'onlyoffice' 
        }
      });
      
      if (error) {
        console.error('❌ Erro na função view-doc:', error);
        throw new Error(`Erro na função: ${error.message || 'Erro interno do servidor'}`);
      }
      
      console.log('📄 Resposta da função:', data);
      
      if (!data?.config) {
        console.error('❌ Resposta inválida da função:', data);
        throw new Error('Configuração do OnlyOffice não encontrada na resposta');
      }
      
      console.log('✅ Config OnlyOffice recebido, abrindo editor...');
      openOnlyOffice(data.config);
    } catch (error) {
      console.error('❌ Erro ao abrir OnlyOffice:', error);
      alert(`Erro ao abrir documento no OnlyOffice: ${error.message}`);
    }
  };

  const openOnlyOffice = (config: any) => {
    const html = `<!doctype html>
<html><head>
  <meta charset="utf-8"/>
  <title>${config.document.title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <script src="https://office.aksell.com.br/web-apps/apps/api/documents/api.js"></script>
  <style>html,body,#placeholder{height:100%;width:100%;margin:0}</style>
</head><body>
  <div id="placeholder"></div>
  <script>
    const cfg = ${JSON.stringify(config)};
    if (typeof DocsAPI==='undefined') document.body.innerText='DocsAPI não carregou';
    else new DocsAPI.DocEditor('placeholder', cfg);
  <\/script>
</body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(()=>URL.revokeObjectURL(url), 30000);
  };

  const handleViewerSelect = async (viewerType: 'iframe' | 'pdfjs' | 'onlyoffice') => {
    const baseUrl = 'https://nahyrexnxhzutfeqxjte.supabase.co';
    
    if (viewerType === 'onlyoffice') {
      await visualizarOnlyOffice(documentId);
    } else {
      // Get auth token for other viewers
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      // Handle other viewer types (iframe, pdfjs)
      let viewUrl = '';
      
      switch (viewerType) {
        case 'iframe':
          viewUrl = `${baseUrl}/functions/v1/view-doc?id=${documentId}&viewer=iframe`;
          break;
        case 'pdfjs':
          viewUrl = `${baseUrl}/functions/v1/view-doc?id=${documentId}&viewer=pdfjs`;
          break;
      }

      // Add token to URL if available
      if (token) {
        viewUrl += `&token=${token}`;
      }

      // Open in new tab
      window.open(viewUrl, '_blank', 'noopener,noreferrer');
    }
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Escolher Visualizador
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            <strong>{documentName}</strong>
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <p className="text-sm text-muted-foreground">
            Selecione como deseja visualizar o documento:
          </p>

          <div className="space-y-3">
            <Button 
              onClick={() => handleViewerSelect('iframe')}
              className="w-full justify-start"
              variant="outline"
            >
              <Monitor className="h-4 w-4 mr-3" />
              <div className="text-left">
                <div className="font-medium">Visualização Direta</div>
                <div className="text-xs text-muted-foreground">Abrir PDF diretamente no navegador</div>
              </div>
            </Button>

            <Button 
              onClick={() => handleViewerSelect('pdfjs')}
              className="w-full justify-start"
              variant="outline"
            >
              <Code className="h-4 w-4 mr-3" />
              <div className="text-left">
                <div className="font-medium">PDF.js</div>
                <div className="text-xs text-muted-foreground">Visualizador JavaScript avançado</div>
              </div>
            </Button>

            <Button 
              onClick={() => handleViewerSelect('onlyoffice')}
              className="w-full justify-start"
              variant="outline"
            >
              <Globe className="h-4 w-4 mr-3" />
              <div className="text-left">
                <div className="font-medium">OnlyOffice</div>
                <div className="text-xs text-muted-foreground">Visualização online completa</div>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};