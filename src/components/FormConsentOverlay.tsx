import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, ExternalLink } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'react-router-dom';

interface FormConsentOverlayProps {
  formTitle: string;
  onAccept: () => void;
  onReject: () => void;
}

export const FormConsentOverlay: React.FC<FormConsentOverlayProps> = ({
  formTitle,
  onAccept,
  onReject
}) => {
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState(false);
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);

  const canProceed = hasAcceptedPrivacy && hasAcceptedDisclaimer;

  const handleAccept = () => {
    if (canProceed) {
      onAccept();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full shadow-xl border-2">
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                <h2 className="text-2xl font-bold">
                  Consentimento de Privacidade
                </h2>
              </div>

              <div className="space-y-4">
                <p className="text-base">
                  <strong>Antes de prosseguir com o preenchimento do formulário "{formTitle}", é necessário aceitar os termos abaixo:</strong>
                </p>
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Importante:</strong> Este formulário e suas perguntas foram projetados para coletar dados específicos e não representam nem limitam os pensamentos, ideias e opiniões da AKSELL NUTRITION LTDA. O objetivo é exclusivamente a coleta de informações para fins determinados e legítimos.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="privacy-consent"
                    checked={hasAcceptedPrivacy}
                    onCheckedChange={(checked) => setHasAcceptedPrivacy(!!checked)}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <label 
                      htmlFor="privacy-consent" 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Li e aceito a Política de Privacidade da empresa
                    </label>
                    <div>
                      <Link 
                        to="/site/privacidade/pt" 
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        📋 Ler Política de Privacidade completa
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="disclaimer-consent"
                    checked={hasAcceptedDisclaimer}
                    onCheckedChange={(checked) => setHasAcceptedDisclaimer(!!checked)}
                    className="mt-1"
                  />
                  <label 
                    htmlFor="disclaimer-consent" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Compreendo que este formulário tem finalidade específica de coleta de dados e não representa opiniões ou limitações da empresa
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleAccept}
                  disabled={!canProceed}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  ✅ Aceitar e Prosseguir
                </Button>
                
                <Button 
                  onClick={onReject}
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                >
                  ❌ Cancelar
                </Button>
              </div>

              <div className="text-xs text-muted-foreground text-center pt-2">
                Seus dados serão tratados conforme nossa Política de Privacidade e a Lei Geral de Proteção de Dados (LGPD).
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};