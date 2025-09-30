import React from 'react';
import { AlertTriangle, FileText, Zap, Clock, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface FileValidationWarningProps {
  file: File;
  estimatedProcessingTime?: number;
  recommendedOptimizations: string[];
  onOptimize?: () => void;
  onProceed?: () => void;
}

export const FileValidationWarning: React.FC<FileValidationWarningProps> = ({
  file,
  estimatedProcessingTime,
  recommendedOptimizations,
  onOptimize,
  onProceed
}) => {
  const fileSizeMB = file.size / (1024 * 1024);
  
  const getSeverityLevel = () => {
    if (fileSizeMB > 15) return 'critical';
    if (fileSizeMB > 10) return 'warning';
    if (fileSizeMB > 5) return 'info';
    return 'ok';
  };
  
  const severity = getSeverityLevel();
  
  const getAlertVariant = () => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      default: return 'default';
    }
  };
  
  const getIcon = () => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-warning" />;
      default: return <FileText className="h-5 w-5 text-primary" />;
    }
  };
  
  const getTitle = () => {
    switch (severity) {
      case 'critical': return 'Arquivo Muito Grande - Otimização Necessária';
      case 'warning': return 'Arquivo Grande - Otimização Recomendada';
      case 'info': return 'Arquivo Médio - Processamento Otimizado';
      default: return 'Arquivo Otimizado';
    }
  };
  
  const getDescription = () => {
    switch (severity) {
      case 'critical': 
        return `Arquivo de ${fileSizeMB.toFixed(1)}MB pode causar falha no processamento. Otimização automática será aplicada.`;
      case 'warning':
        return `Arquivo de ${fileSizeMB.toFixed(1)}MB pode demorar mais para processar. Recomendamos otimização.`;
      case 'info':
        return `Arquivo de ${fileSizeMB.toFixed(1)}MB será processado com configurações otimizadas.`;
      default:
        return `Arquivo de ${fileSizeMB.toFixed(1)}MB está no tamanho ideal para processamento.`;
    }
  };

  if (severity === 'ok') {
    return null; // Não mostrar aviso para arquivos pequenos
  }

  return (
    <Alert variant={getAlertVariant()} className="mb-4">
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1 space-y-3">
          <div>
            <h4 className="font-semibold text-sm">{getTitle()}</h4>
            <AlertDescription className="text-sm mt-1">
              {getDescription()}
            </AlertDescription>
          </div>
          
          {/* File Details */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              {fileSizeMB.toFixed(1)}MB
            </Badge>
            
            {estimatedProcessingTime && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                ~{Math.ceil(estimatedProcessingTime / 60)}min
              </Badge>
            )}
            
            <Badge variant="outline" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              OCR Automático
            </Badge>
          </div>
          
          {/* Recommended Optimizations */}
          {recommendedOptimizations.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-muted-foreground">
                Otimizações que serão aplicadas automaticamente:
              </h5>
              <ul className="text-xs space-y-1 text-muted-foreground">
                {recommendedOptimizations.map((optimization, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <Shield className="h-3 w-3" />
                    <span>{optimization}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Action Buttons */}
          {severity === 'critical' && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={onOptimize}
                className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-md hover:bg-primary/90 transition-colors"
              >
                Aplicar Otimizações
              </button>
              <button
                onClick={onProceed}
                className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-md hover:bg-muted/80 transition-colors"
              >
                Prosseguir Mesmo Assim
              </button>
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
};