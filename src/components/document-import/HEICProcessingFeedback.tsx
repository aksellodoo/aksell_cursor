import React from 'react';
import { AlertTriangle, CheckCircle, Info, Smartphone } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { HEICValidationResult } from '@/hooks/useHEICSupport';

interface HEICProcessingFeedbackProps {
  fileName: string;
  validation: HEICValidationResult;
  isFromCamera?: boolean;
  isMobile?: boolean;
}

export const HEICProcessingFeedback: React.FC<HEICProcessingFeedbackProps> = ({
  fileName,
  validation,
  isFromCamera,
  isMobile
}) => {
  if (!validation.isHEIC) return null;

  return (
    <div className="space-y-2">
      {/* Badge indicando HEIC */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="text-xs">
          HEIC
        </Badge>
        
        {isFromCamera && (
          <Badge variant="outline" className="text-xs">
            <Smartphone className="w-3 h-3 mr-1" />
            Câmera
          </Badge>
        )}
        
        {validation.isSupported ? (
          <Badge variant="default" className="text-xs bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Suportado
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-amber-600">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Preview limitado
          </Badge>
        )}
      </div>

      {/* Avisos e sugestões */}
      {validation.warnings.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            <div className="space-y-1">
              {validation.warnings.map((warning, index) => (
                <p key={index} className="text-xs">{warning}</p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Sugestões */}
      {validation.suggestions.length > 0 && (
        <div className="text-xs text-muted-foreground space-y-1">
          {validation.suggestions.map((suggestion, index) => (
            <p key={index}>💡 {suggestion}</p>
          ))}
        </div>
      )}

      {/* Status de processamento */}
      <div className="text-xs text-green-600 flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        OCR processará normalmente
      </div>
    </div>
  );
};