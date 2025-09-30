import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import EmailHtmlEditor from '@/components/ui/email-html-editor';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { Shield, FileText, Save, Eye, RotateCcw, Trash2, ExternalLink, Languages, AlertTriangle, CheckCircle } from 'lucide-react';
import { useSiteDocuments, SiteDocument } from '@/hooks/useSiteDocuments';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_PRIVACY_POLICY = `<h1>📄 Política de Privacidade</h1>

<h2>1. Introdução</h2>
<p>A <strong>AKSELL NUTRITION LTDA</strong> valoriza a privacidade e a proteção dos dados pessoais de seus visitantes e usuários. Esta Política de Privacidade explica como coletamos, utilizamos, armazenamos e protegemos seus dados pessoais, em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018)</strong>.</p>
<p>Ao acessar nosso site e ou ao utilizar nossos formulários ou nossos serviços, você concorda com os termos descritos nesta política.</p>

<hr>

<h2>2. Dados Coletados</h2>
<p>Podemos coletar as seguintes informações:</p>
<ul>
  <li><strong>Dados de identificação pessoal:</strong> nome, e-mail, telefone, empresa, cargo, site da empresa.</li>
  <li><strong>Dados de navegação e cookies:</strong> endereço IP, navegador, páginas acessadas, tempo de permanência, preferências de navegação.</li>
  <li><strong>Dados fornecidos em formulários:</strong> informações necessárias para solicitação de orçamento, contato, cadastro ou outras interações.</li>
</ul>

<hr>

<h2>3. Finalidade da Coleta</h2>
<p>Os dados são utilizados para:</p>
<ul>
  <li>Responder solicitações de contato e orçamentos;</li>
  <li>Disponibilizar acesso a serviços ou materiais solicitados;</li>
  <li>Melhorar a experiência de navegação no site;</li>
  <li>Enviar comunicações institucionais, promocionais ou personalizadas, sempre respeitando sua opção de consentimento;</li>
  <li>Cumprir obrigações legais e regulatórias.</li>
</ul>

<hr>

<h2>4. Cookies</h2>
<p>Utilizamos cookies e tecnologias semelhantes para otimizar sua experiência.</p>
<p><strong>Exemplo de aviso:</strong></p>
<blockquote>
  <p>Utilizamos cookies para melhorar sua experiência de navegação, veicular anúncios ou conteúdo personalizado e analisar nosso tráfego. Ao clicar em "Aceitar todos", você concorda com o uso de cookies.</p>
</blockquote>
<p>Você pode gerenciar suas preferências de cookies a qualquer momento em seu navegador ou em nosso painel de configuração (quando disponível).</p>

<hr>

<h2>5. Compartilhamento de Dados</h2>
<p>Seus dados pessoais <strong>não serão vendidos</strong>.</p>
<p>Podem ser compartilhados apenas com:</p>
<ul>
  <li>Fornecedores e parceiros necessários para execução dos serviços;</li>
  <li>Autoridades públicas, quando exigido por lei.</li>
</ul>

<hr>

<h2>6. Direitos do Titular (LGPD – Art. 18)</h2>
<p>Você, enquanto titular de dados, possui o direito de:</p>
<ul>
  <li>Confirmar se tratamos seus dados;</li>
  <li>Acessar os dados pessoais que possuímos sobre você;</li>
  <li>Solicitar correção de dados incompletos ou desatualizados;</li>
  <li>Solicitar exclusão de dados pessoais (exceto quando a lei exigir sua manutenção);</li>
  <li>Revogar o consentimento a qualquer momento;</li>
  <li>Solicitar portabilidade dos dados para outro fornecedor de serviço.</li>
</ul>
<p>Para exercer seus direitos, entre em contato pelo e-mail: <strong>contato@aksell.com.br</strong>.</p>

<hr>

<h2>7. Segurança e Armazenamento</h2>
<p>Adotamos medidas técnicas e organizacionais para proteger seus dados contra acessos não autorizados, destruição, perda ou alteração.</p>
<p>Os dados são armazenados em servidores seguros e apenas pelo tempo necessário para cumprir as finalidades informadas.</p>

<hr>

<h2>8. Base Legal</h2>
<p>O tratamento dos dados pessoais é realizado com fundamento em:</p>
<ul>
  <li><strong>Consentimento do titular</strong> (art. 7º, I);</li>
  <li><strong>Execução de contratos e procedimentos preliminares</strong> (art. 7º, V);</li>
  <li><strong>Cumprimento de obrigação legal ou regulatória</strong> (art. 7º, II);</li>
  <li><strong>Legítimo interesse</strong> (art. 7º, IX), sempre respeitando os direitos e liberdades do titular.</li>
</ul>

<hr>

<h2>9. Alterações na Política</h2>
<p>Reservamo-nos o direito de alterar esta Política de Privacidade a qualquer momento, sendo as atualizações publicadas em nosso site/app. Recomendamos consulta periódica.</p>

<hr>

<h2>10. Contato</h2>
<p>Em caso de dúvidas, solicitações ou reclamações relacionadas à privacidade e proteção de dados, entre em contato com nosso <strong>Encarregado de Dados (DPO)</strong> pelo e-mail: <strong>dpo@aksell.com.br</strong>.</p>`;

const SitePrivacyPolicy: React.FC = () => {
  const [currentLocale, setCurrentLocale] = useState<'pt' | 'en'>('pt');
  const [ptContent, setPtContent] = useState('');
  const [enContent, setEnContent] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [ptDocument, setPtDocument] = useState<SiteDocument | null>(null);
  const [enDocument, setEnDocument] = useState<SiteDocument | null>(null);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translationSynced, setTranslationSynced] = useState(false);
  const { getDocument, saveDocument, loading } = useSiteDocuments();

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        // Load Portuguese version
        const ptDoc = await getDocument('privacy-policy', 'pt');
        if (ptDoc) {
          setPtDocument(ptDoc);
          setPtContent(ptDoc.content_html);
        } else {
          setPtContent(DEFAULT_PRIVACY_POLICY);
        }

        // Load English version
        const enDoc = await getDocument('privacy-policy', 'en');
        if (enDoc) {
          setEnDocument(enDoc);
          setEnContent(enDoc.content_html);
        }
      } catch (error) {
        console.error('Error loading documents:', error);
        setPtContent(DEFAULT_PRIVACY_POLICY);
      }
    };

    loadDocuments();
  }, []);

  const getCurrentContent = () => {
    return currentLocale === 'pt' ? ptContent : enContent;
  };

  const setCurrentContent = (content: string) => {
    if (currentLocale === 'pt') {
      setPtContent(content);
    } else {
      setEnContent(content);
    }
  };

  const getCurrentDocument = () => {
    return currentLocale === 'pt' ? ptDocument : enDocument;
  };

  const handleSave = async () => {
    const content = getCurrentContent();
    if (!content.trim()) {
      toast.error('O conteúdo não pode estar vazio');
      return;
    }

    setSaving(true);
    try {
      const title = currentLocale === 'pt' ? 'Política de Privacidade' : 'Privacy Policy';
      const savedDoc = await saveDocument(
        'privacy-policy',
        title,
        content,
        currentLocale,
        true
      );
      
      if (savedDoc) {
        if (currentLocale === 'pt') {
          setPtDocument(savedDoc);
        } else {
          setEnDocument(savedDoc);
        }
        toast.success('Documento salvo com sucesso!');
        
        // Show translation update suggestion if saving PT and EN is outdated
        if (currentLocale === 'pt' && shouldShowUpdateSuggestion()) {
          toast.info('Considere atualizar a tradução em inglês', {
            action: {
              label: 'Atualizar',
              onClick: () => handleTranslate()
            }
          });
        }
      }
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Erro ao salvar documento');
    } finally {
      setSaving(false);
    }
  };

  const handleTranslate = async () => {
    if (!ptContent.trim()) {
      toast.error('Não há conteúdo em português para traduzir');
      return;
    }

    setTranslating(true);
    setTranslationSynced(false);
    try {
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: {
          text: ptContent,
          context: 'privacy_policy_html',
          targetLanguage: 'english'
        }
      });

      if (error) {
        throw error;
      }

      if (data?.translation) {
        setEnContent(data.translation);
        
        // Auto-save the translation
        const savedDoc = await saveDocument(
          'privacy-policy',
          'Privacy Policy',
          data.translation,
          'en',
          true
        );
        
        if (savedDoc) {
          setEnDocument(savedDoc);
        }
        
        toast.success('Tradução concluída e salva!');
        setTranslationSynced(true);
        
        // Hide the badge after 10 seconds
        setTimeout(() => {
          setTranslationSynced(false);
        }, 10000);
      } else {
        throw new Error('Tradução não recebida');
      }
    } catch (error) {
      console.error('Error translating:', error);
      toast.error('Erro ao traduzir conteúdo. Verifique se a API key do OpenAI está configurada.');
    } finally {
      setTranslating(false);
    }
  };

  const handleRestoreTemplate = () => {
    if (currentLocale === 'pt') {
      setPtContent(DEFAULT_PRIVACY_POLICY);
      toast.info('Template padrão restaurado');
    } else {
      toast.error('Template padrão disponível apenas para português');
    }
  };

  const handleClear = () => {
    setCurrentContent('');
    toast.info('Conteúdo limpo');
  };

  const togglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  const getSanitizedHTML = () => {
    return DOMPurify.sanitize(getCurrentContent());
  };

  const shouldShowUpdateSuggestion = () => {
    if (!ptDocument || !enDocument) return !!ptDocument && !enDocument;
    return new Date(ptDocument.updated_at) > new Date(enDocument.updated_at);
  };

  const isEnglishOutdated = shouldShowUpdateSuggestion();

  return (
    <ResponsiveContainer>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Política de Privacidade</h1>
          </div>
          <p className="text-muted-foreground">
            Configure a política de privacidade do site em conformidade com a LGPD (PT/EN)
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Editor de Política de Privacidade
                </CardTitle>
                <CardDescription>
                  Edite o conteúdo da política de privacidade em português e inglês
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {getCurrentDocument() && (
                  <Badge variant="secondary" className="text-xs">
                    {currentLocale.toUpperCase()} v{getCurrentDocument()?.version} - {new Date(getCurrentDocument()?.updated_at || '').toLocaleString('pt-BR')}
                  </Badge>
                )}
                {isEnglishOutdated && (
                  <Badge variant="destructive" className="text-xs flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    EN desatualizada
                  </Badge>
                )}
                {translationSynced && (
                  <Badge variant="default" className="text-xs flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle className="h-3 w-3" />
                    Tradução sincronizada
                  </Badge>
                )}
                <Link 
                  to={`/site/privacidade/${currentLocale}`} 
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Ver versão pública
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={currentLocale} onValueChange={(value) => setCurrentLocale(value as 'pt' | 'en')}>
              <TabsList>
                <TabsTrigger value="pt" className="flex items-center gap-2">
                  🇧🇷 Português
                  {ptDocument && <span className="text-xs opacity-70">v{ptDocument.version}</span>}
                </TabsTrigger>
                <TabsTrigger value="en" className="flex items-center gap-2">
                  🇺🇸 English
                  {enDocument && <span className="text-xs opacity-70">v{enDocument.version}</span>}
                  {!enDocument && <span className="text-xs opacity-70 text-amber-600">não criada</span>}
                </TabsTrigger>
              </TabsList>
              
              <div className="mt-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button 
                    onClick={handleSave} 
                    size="sm" 
                    disabled={saving || loading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Salvando...' : `Salvar ${currentLocale.toUpperCase()}`}
                  </Button>
                  
                  {currentLocale === 'pt' && (
                    <Button 
                      onClick={handleTranslate}
                      size="sm"
                      variant={isEnglishOutdated ? "default" : "outline"}
                      disabled={translating || !ptContent.trim()}
                    >
                      <Languages className="h-4 w-4 mr-2" />
                      {translating ? 'Traduzindo...' : 'Atualizar tradução em inglês'}
                    </Button>
                  )}
                  
                  <Button 
                    onClick={togglePreview} 
                    variant="outline" 
                    size="sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {isPreviewMode ? 'Editar' : 'Visualizar'}
                  </Button>
                  
                  {currentLocale === 'pt' && (
                    <Button 
                      onClick={handleRestoreTemplate} 
                      variant="outline" 
                      size="sm"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restaurar Modelo
                    </Button>
                  )}
                  
                  <Button 
                    onClick={handleClear} 
                    variant="outline" 
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                </div>

                <Separator />

                <TabsContent value="pt" className="mt-4">
                  {isPreviewMode ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Visualização da Política (Português)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div 
                          className="prose prose-sm max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: getSanitizedHTML() }}
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      <EmailHtmlEditor
                        value={ptContent}
                        onChange={setPtContent}
                        placeholder="Digite o conteúdo da política de privacidade em português..."
                        height={600}
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="en" className="mt-4">
                  {isPreviewMode ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Privacy Policy Preview (English)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div 
                          className="prose prose-sm max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: getSanitizedHTML() }}
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {!enContent.trim() && (
                        <div className="bg-muted/50 border border-dashed rounded-lg p-6 text-center text-muted-foreground">
                          <Languages className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium mb-2">Versão em inglês não criada</p>
                          <p className="text-sm mb-4">
                            Clique em "Atualizar tradução em inglês" na aba Português para gerar automaticamente ou digite o conteúdo aqui.
                          </p>
                        </div>
                      )}
                      <EmailHtmlEditor
                        value={enContent}
                        onChange={setEnContent}
                        placeholder="Enter the privacy policy content in English..."
                        height={600}
                      />
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ℹ️ Informações Importantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>LGPD:</strong> Esta política foi elaborada seguindo as diretrizes da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
              </p>
              <p>
                <strong>Tradução Automática:</strong> A versão em inglês pode ser gerada automaticamente via OpenAI e depois editada manualmente.
              </p>
              <p>
                <strong>Personalização:</strong> Você pode editar livremente o conteúdo para adequar à realidade específica da sua empresa.
              </p>
              <p>
                <strong>Contatos:</strong> Lembre-se de atualizar os e-mails de contato (contato@aksell.com.br e dpo@aksell.com.br) conforme necessário.
              </p>
              <p>
                <strong>Acesso Público:</strong> As políticas publicadas podem ser visualizadas em{' '}
                <Link to="/site/privacidade/pt" className="text-primary hover:underline">
                  /site/privacidade/pt
                </Link>
                {' '}e{' '}
                <Link to="/site/privacidade/en" className="text-primary hover:underline">
                  /site/privacidade/en
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ResponsiveContainer>
  );
};

export default SitePrivacyPolicy;