import React from 'react';
import { AlertTriangle, RefreshCw, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProcessingErrorFeedbackProps {
  error: string;
  documentId: string;
  onRetry?: () => void;
  onCleanup?: () => void;
  isLoading?: boolean;
}

export const ProcessingErrorFeedback: React.FC<ProcessingErrorFeedbackProps> = ({
  error,
  documentId,
  onRetry,
  onCleanup,
  isLoading = false
}) => {
  const isMemoryError = error?.toLowerCase().includes('memory') || 
                       error?.toLowerCase().includes('timeout') ||
                       error?.toLowerCase().includes('limit');

  const isMobileOptimizationSuggested = isMemoryError && 
    (error?.toLowerCase().includes('image') || error?.toLowerCase().includes('photo'));

  const isProtheusConnectionError = error?.toLowerCase().includes('protheus') ||
                                   error?.toLowerCase().includes('connection') ||
                                   error?.toLowerCase().includes('oracle') ||
                                   error?.toLowerCase().includes('configuração');

  const isInternalError = error?.toLowerCase().includes('internal error') ||
                         error?.toLowerCase().includes('erro interno') ||
                         /^[a-f0-9]{32}$/.test(error || ''); // Check if error is just a hash/ID

  return (
    <div className="space-y-3">
      {/* Erro principal */}
      <Alert className="border-red-200 bg-red-50">
        <XCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-700">
          <div className="space-y-2">
            <p className="text-sm font-medium">Erro no processamento</p>
            <p className="text-xs">{error}</p>
            
            {/* Badges informativos */}
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs border-red-300 text-red-700">
                ID: {documentId.slice(0, 8)}...
              </Badge>
              {isMemoryError && (
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Arquivo grande
                </Badge>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Dicas específicas para diferentes tipos de erro */}
      {isMobileOptimizationSuggested && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            <div className="space-y-1">
              <p className="text-xs font-medium">💡 Dica para imagens do celular:</p>
              <ul className="text-xs space-y-1 ml-2">
                <li>• Reduza a resolução da foto antes de enviar</li>
                <li>• Use qualidade "Alta" ao invés de "Máxima" na câmera</li>
                <li>• Tente enviar uma imagem por vez</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {isProtheusConnectionError && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            <div className="space-y-1">
              <p className="text-xs font-medium">🔧 Problema de conexão Protheus:</p>
              <ul className="text-xs space-y-1 ml-2">
                <li>• Verifique se a configuração do Protheus está ativa</li>
                <li>• Confirme se os dados de conexão estão corretos</li>
                <li>• Tente novamente em alguns minutos</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {isInternalError && (
        <Alert className="border-purple-200 bg-purple-50">
          <AlertTriangle className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-purple-700">
            <div className="space-y-1">
              <p className="text-xs font-medium">⚙️ Erro interno do sistema:</p>
              <ul className="text-xs space-y-1 ml-2">
                <li>• Este erro foi registrado automaticamente</li>
                <li>• Nossa equipe será notificada para investigar</li>
                <li>• Tente novamente ou contate o suporte se persistir</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Botões de ação */}
      <div className="flex gap-2 flex-wrap">
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isLoading}
            className="text-xs"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Tentar Novamente
          </Button>
        )}
        
        {onCleanup && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCleanup}
            disabled={isLoading}
            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Limpar Documento
          </Button>
        )}
      </div>

      {/* Informações técnicas (colapsível) */}
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">
          Detalhes técnicos
        </summary>
        <div className="mt-2 p-2 bg-muted/50 rounded text-xs font-mono">
          <p>Documento ID: {documentId}</p>
          <p>Tipo: {isMemoryError ? 'Erro de memória/timeout' : 'Erro de processamento'}</p>
          <p>Erro bruto: {error}</p>
        </div>
      </details>
    </div>
  );
};