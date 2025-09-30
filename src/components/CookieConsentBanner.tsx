import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, X, Flag } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const CONSENT_KEY = 'cookie_consent';

export const CookieConsentBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [consentGiven, setConsentGiven] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<'pt' | 'en'>('pt');
  const location = useLocation();
  const navigate = useNavigate();

  // Check if we're on a privacy policy route
  const isPrivacyRoute = location.pathname.includes('/site/privacidade/');

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    setConsentGiven(consent);
    
    // Initialize language from URL or default to 'pt'
    const pathLang = location.pathname.includes('/en') ? 'en' : 'pt';
    setSelectedLang(pathLang);
    
    // Show banner if no consent decision has been made
    if (!consent) {
      setShowBanner(true);
    }
  }, [location.pathname]);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setConsentGiven('accepted');
    setShowBanner(false);
    // Redirect to home page in selected language
    navigate(`/site/home/${selectedLang}`);
  };

  const handleReject = () => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setConsentGiven('declined');
    // Keep banner visible when declined - user cannot continue navigation
    setShowBanner(true);
  };

  // If consent was given (accepted), don't show anything
  if (consentGiven === 'accepted') {
    return null;
  }

  // Don't show banner on privacy policy route (allow reading policy without consent)
  if (isPrivacyRoute) {
    return null;
  }

  // If no consent or declined, show the banner/overlay
  if (!showBanner) {
    return null;
  }

  const isDeclined = consentGiven === 'declined';

  const texts = {
    pt: {
      title: isDeclined ? 'Consentimento Necessário' : 'Política de Cookies',
      description: isDeclined 
        ? 'Para continuar navegando em nosso site, é necessário aceitar nossa Política de Privacidade e o uso de cookies.'
        : '🔒 Utilizamos cookies e coletamos dados conforme nossa Política de Privacidade.',
      details: isDeclined
        ? 'Caso não deseje aceitar, recomendamos fechar esta página.'
        : 'Ao clicar em "Aceitar e continuar", você concorda com o uso de cookies e com a Política de Privacidade. Caso não aceite, não será possível continuar a navegação em nosso site.',
      readPolicy: '📋 Ler Política de Privacidade completa',
      accept: '✅ Aceitar e continuar',
      reject: '❌ Recusar',
      closeNote: 'Para fechar esta página, use o botão fechar do navegador ou tecle Alt+F4'
    },
    en: {
      title: isDeclined ? 'Consent Required' : 'Cookie Policy',
      description: isDeclined
        ? 'To continue browsing our website, you must accept our Privacy Policy and the use of cookies.'
        : '🔒 We use cookies and collect data according to our Privacy Policy.',
      details: isDeclined
        ? 'If you do not wish to accept, we recommend closing this page.'
        : 'By clicking "Accept and continue", you agree to the use of cookies and the Privacy Policy. If you do not accept, you will not be able to continue browsing our website.',
      readPolicy: '📋 Read complete Privacy Policy',
      accept: '✅ Accept and continue',
      reject: '❌ Reject',
      closeNote: 'To close this page, use the browser close button or press Alt+F4'
    }
  };

  const currentTexts = texts[selectedLang];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full shadow-xl border-2">
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Language Selector */}
              <div className="flex justify-end gap-2">
                <Button
                  variant={selectedLang === 'pt' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedLang('pt')}
                  className={`px-3 py-1 ${selectedLang === 'pt' ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  🇧🇷 PT
                </Button>
                <Button
                  variant={selectedLang === 'en' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedLang('en')}
                  className={`px-3 py-1 ${selectedLang === 'en' ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  🇺🇸 EN
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                <h2 className="text-2xl font-bold">
                  {currentTexts.title}
                </h2>
              </div>

              {isDeclined ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    {currentTexts.description}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentTexts.details}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-base">
                    <strong>{currentTexts.description}</strong>
                  </p>
                  <p className="text-muted-foreground">
                    {currentTexts.details}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Link 
                  to={`/site/privacidade/${selectedLang}`} 
                  className="text-sm text-primary hover:underline inline-block"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {currentTexts.readPolicy}
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleAccept}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {currentTexts.accept}
                </Button>
                
                {!isDeclined && (
                  <Button 
                    onClick={handleReject}
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    {currentTexts.reject}
                  </Button>
                )}
              </div>

              {isDeclined && (
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground text-center">
                    {currentTexts.closeNote}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
