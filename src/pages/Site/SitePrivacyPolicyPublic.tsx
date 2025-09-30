import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, FileText, Calendar } from 'lucide-react';
import { useSiteDocuments, SiteDocument } from '@/hooks/useSiteDocuments';
import DOMPurify from 'dompurify';

const SitePrivacyPolicyPublic: React.FC = () => {
  const { lang = 'pt' } = useParams<{ lang?: string }>();
  const [document, setDocument] = useState<SiteDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const { getPublicDocument } = useSiteDocuments();

  useEffect(() => {
    const loadDocument = async () => {
      setLoading(true);
      try {
        const doc = await getPublicDocument('privacy-policy', lang);
        setDocument(doc);
      } catch (error) {
        console.error('Error loading privacy policy:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [lang]);

  const getSanitizedHTML = () => {
    if (!document?.content_html) return '';
    return DOMPurify.sanitize(document.content_html);
  };

  const translations = {
    pt: {
      loading: 'Carregando política de privacidade...',
      notFound: 'Política de Privacidade não encontrada',
      notFoundDescription: 'A política de privacidade ainda não foi publicada ou não está disponível no momento.',
      lastUpdated: 'Última atualização:',
      version: 'Versão',
      contactTitle: 'Contato para Questões de Privacidade',
      dpoLabel: 'Encarregado de Dados (DPO):',
      generalContactLabel: 'Contato Geral:'
    },
    en: {
      loading: 'Loading privacy policy...',
      notFound: 'Privacy Policy not found',
      notFoundDescription: 'The privacy policy has not been published yet or is not available at the moment.',
      lastUpdated: 'Last updated:',
      version: 'Version',
      contactTitle: 'Contact for Privacy Questions',
      dpoLabel: 'Data Protection Officer (DPO):',
      generalContactLabel: 'General Contact:'
    }
  };

  // Use document locale if available, otherwise fall back to URL lang parameter
  const effectiveLang = document?.locale || lang || 'pt';
  const t = translations[effectiveLang as keyof typeof translations] || translations.pt;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">{t.loading}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">{t.notFound}</h1>
            <p className="text-muted-foreground">
              {t.notFoundDescription}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">{document.title}</h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {t.lastUpdated} {new Date(document.updated_at).toLocaleDateString(effectiveLang === 'en' ? 'en-US' : 'pt-BR')}
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                {t.version} {document.version}
              </Badge>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">AKSELL NUTRITION LTDA</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-li:text-muted-foreground prose-blockquote:text-muted-foreground prose-blockquote:border-l-primary"
                dangerouslySetInnerHTML={{ __html: getSanitizedHTML() }}
              />
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <h3 className="font-semibold">{t.contactTitle}</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      <strong>{t.dpoLabel}</strong>{' '}
                      <a href="mailto:dpo@aksell.com.br" className="text-primary hover:underline">
                        dpo@aksell.com.br
                      </a>
                    </p>
                    <p>
                      <strong>{t.generalContactLabel}</strong>{' '}
                      <a href="mailto:contato@aksell.com.br" className="text-primary hover:underline">
                        contato@aksell.com.br
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SitePrivacyPolicyPublic;