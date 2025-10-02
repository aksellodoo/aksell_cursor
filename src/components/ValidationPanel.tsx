import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { AlertTriangle, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { ValidationResult } from '../hooks/useFormValidation';

interface ValidationPanelProps {
  validation: ValidationResult;
  onNavigateToTab: (tab: string) => void;
}

export const ValidationPanel = ({ validation, onNavigateToTab }: ValidationPanelProps) => {
  const { criticalErrors, warningErrors, completionPercentage, errorsByTab } = validation;

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Progresso da Configuração</span>
          <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
        </div>
        <Progress value={completionPercentage} className="w-full" />
      </div>

      {/* Critical Errors */}
      {criticalErrors.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Erros que impedem o salvamento:</p>
              <ul className="space-y-1">
                {criticalErrors.map((error, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span className="text-sm">• {error.message}</span>
                    <button
                      onClick={() => onNavigateToTab(error.tab)}
                      className="text-xs text-destructive hover:underline flex items-center gap-1"
                    >
                      Corrigir <ArrowRight className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Warning Errors */}
      {warningErrors.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Avisos (não impedem o salvamento):</p>
              <ul className="space-y-1">
                {warningErrors.map((error, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span className="text-sm">• {error.message}</span>
                    <button
                      onClick={() => onNavigateToTab(error.tab)}
                      className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
                    >
                      Ver <ArrowRight className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Success State */}
      {validation.isValid && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <p className="font-medium">Configuração válida!</p>
            <p className="text-sm">Todos os campos obrigatórios foram preenchidos corretamente.</p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};