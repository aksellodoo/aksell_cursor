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

  const getTabStatus = (tab: string) => {
    const tabErrors = errorsByTab[tab] || [];
    const hasCritical = tabErrors.some(e => e.severity === 'critical');
    const hasWarning = tabErrors.some(e => e.severity === 'warning');
    
    if (hasCritical) return 'error';
    if (hasWarning) return 'warning';
    return 'success';
  };

  const getTabIcon = (status: string) => {
    switch (status) {
      case 'error': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return null;
    }
  };

  const tabs = [
    { key: 'publication', label: 'Publicação' },
    { key: 'recipients', label: 'Destinatários' },
    { key: 'settings', label: 'Configurações' }
  ];

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

      {/* Tab Status Overview */}
      <div className="grid grid-cols-3 gap-2">
        {tabs.map(tab => {
          const status = getTabStatus(tab.key);
          const tabErrors = errorsByTab[tab.key] || [];
          
          return (
            <button
              key={tab.key}
              onClick={() => onNavigateToTab(tab.key)}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-2">
                {getTabIcon(status)}
                <span className="text-sm font-medium">{tab.label}</span>
              </div>
              {tabErrors.length > 0 && (
                <Badge variant={status === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                  {tabErrors.length}
                </Badge>
              )}
            </button>
          );
        })}
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