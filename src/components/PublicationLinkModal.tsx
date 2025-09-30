import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, ExternalLink, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getBaseUrl } from '@/lib/config';

interface PublicationLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: {
    id: string;
    title: string;
    publication_status: string;
    publication_links?: {
      internal?: string;
      external?: string;
      direct_external?: string;
    };
  };
}

export const PublicationLinkModal = ({ open, onOpenChange, form }: PublicationLinkModalProps) => {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Gerar links se não existirem
  const baseUrl = getBaseUrl();
  const links = form.publication_links || {};
  
  const defaultLinks = {
    internal: links.internal || `${baseUrl}/formulario/${form.id}`,
    external: links.external || `${baseUrl}/formulario/${form.id}`,
    direct_external: links.direct_external || `${baseUrl}/forms/external/${form.id}`
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(text);
      toast.success(`${label} copiado para a área de transferência!`);
      
      // Reset do estado de copiado após 2 segundos
      setTimeout(() => {
        setCopiedLink(null);
      }, 2000);
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const openInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  const getLinkDescription = (type: string) => {
    switch (type) {
      case 'internal':
        return 'Tela de seleção - usuários podem escolher entre acesso interno ou externo';
      case 'external':
        return 'Mesmo link da tela de seleção (compatibilidade)';
      case 'direct_external':
        return 'Acesso direto para usuários externos (login ou anônimo)';
      default:
        return '';
    }
  };

  const shouldShowLink = (type: string) => {
    if (form.publication_status === 'published_internal') {
      return type === 'internal';
    }
    return form.publication_status === 'published_external' || form.publication_status === 'published_mixed';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Links de Publicação - {form.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Link Principal */}
          {shouldShowLink('internal') && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="font-medium">Link Principal</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openInNewTab(defaultLinks.internal)}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(defaultLinks.internal, 'Link principal')}
                    >
                      {copiedLink === defaultLinks.internal ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Input 
                  value={defaultLinks.internal} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {getLinkDescription('internal')}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Link Direto Externo */}
          {shouldShowLink('direct_external') && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="font-medium">Link Direto Externo</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openInNewTab(defaultLinks.direct_external)}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(defaultLinks.direct_external, 'Link direto externo')}
                    >
                      {copiedLink === defaultLinks.direct_external ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Input 
                  value={defaultLinks.direct_external} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {getLinkDescription('direct_external')}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Informações sobre o tipo de publicação */}
          <Card className="bg-blue-50">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Informações da Publicação</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Status:</strong> {
                  form.publication_status === 'published_internal' ? 'Apenas Interno' :
                  form.publication_status === 'published_external' ? 'Apenas Externo' :
                  form.publication_status === 'published_mixed' ? 'Misto (Interno + Externo)' :
                  'Rascunho'
                }</p>
                {form.publication_status !== 'published_internal' && (
                  <p className="text-blue-700">
                    💡 <strong>Dica:</strong> Use o "Link Principal" para enviar para qualquer pessoa. 
                    Elas poderão escolher o tipo de acesso apropriado.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};