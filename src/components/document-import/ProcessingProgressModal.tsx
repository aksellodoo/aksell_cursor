import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CheckCircle, Loader2, XCircle, Minimize2 } from 'lucide-react';

interface ProcessingStep {
  id: string;
  label: string;
  status: 'waiting' | 'running' | 'completed' | 'error';
  progress: number;
  message?: string;
}

interface ProcessingProgressModalProps {
  isOpen: boolean;
  onForceStop: () => void;
  onClose: () => void;
  onMinimize?: () => void;
  steps: ProcessingStep[];
  logs: string[];
  canForceStop: boolean;
  isCompleted: boolean;
  hasErrors: boolean;
  isPreparingProcessing?: boolean;
}

export const ProcessingProgressModal: React.FC<ProcessingProgressModalProps> = ({
  isOpen,
  onForceStop,
  onClose,
  onMinimize,
  steps,
  logs,
  canForceStop,
  isCompleted,
  hasErrors,
  isPreparingProcessing = false
}) => {
  const getStepIcon = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-muted" />;
    }
  };

  // Simple progress calculation
  const overallProgress = (() => {
    if (isPreparingProcessing) return 5;
    if (isCompleted && !hasErrors) return 100;
    if (steps.length === 0) return 0;
    
    const totalProgress = steps.reduce((sum, step) => sum + step.progress, 0);
    return Math.round(totalProgress / steps.length);
  })();

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="sr-only">
          <DialogTitle>Processamento de Documentos</DialogTitle>
          <DialogDescription>
            Acompanhe o progresso do processamento dos documentos importados
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col h-full min-h-0">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">
                  {isCompleted 
                    ? 'Processamento Concluído' 
                    : isPreparingProcessing 
                    ? 'Preparando Processamento...'
                    : 'Processando Documentos'
                  }
                </h2>
                <p className="text-muted-foreground mt-1">
                  {isCompleted 
                    ? hasErrors 
                      ? 'Processamento finalizado com alguns erros'
                      : 'Todos os documentos foram processados com sucesso'
                    : isPreparingProcessing
                    ? 'Inicializando processamento de documentos...'
                    : 'Por favor, mantenha esta janela aberta durante o processamento'
                  }
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Botão Ocultar - disponível durante processamento */}
                {onMinimize && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onMinimize();
                    }}
                    className="gap-2"
                  >
                    <Minimize2 className="h-4 w-4" />
                    Ocultar
                  </Button>
                )}
                
                {/* Botão Forçar Encerramento */}
                {canForceStop && (
                  <Button 
                    variant="destructive" 
                    onClick={onForceStop}
                    className="ml-4"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Forçar Encerramento
                  </Button>
                )}
                
                {/* Botão Fechar - aparece quando realmente concluído */}
                {isCompleted && (
                  <Button onClick={onClose} variant="default">
                    Fechar
                  </Button>
                )}
              </div>
            </div>

            {/* Overall Progress */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Progresso Geral</span>
                <span>{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          </div>

          {/* Simplified Content */}
          <div className="flex-1 p-6 overflow-hidden min-h-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* Processing Steps */}
              <div className="flex flex-col space-y-4 min-h-0">
                <h3 className="text-lg font-medium">Etapas do Processamento</h3>
                <ScrollArea className="flex-1 min-h-0">
                  <div className="space-y-3">
                    {steps.map((step, index) => (
                      <div key={step.id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          {getStepIcon(step)}
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{step.label}</span>
                              <span className="text-sm text-muted-foreground">{step.progress}%</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Progress value={step.progress} className="h-2" />
                          {step.message && (
                            <p className="text-sm text-muted-foreground">
                              {step.message}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Logs */}
              <div className="flex flex-col space-y-4 min-h-0">
                <h3 className="text-lg font-medium">Logs de Processamento</h3>
                <ScrollArea className="flex-1 min-h-0 border rounded-lg">
                  <div className="p-4 font-mono text-sm space-y-1">
                    {logs.map((log, index) => (
                      <div key={index} className="text-muted-foreground whitespace-pre-wrap">
                        {log}
                      </div>
                    ))}
                    {logs.length === 0 && (
                      <div className="text-muted-foreground/50">
                        Aguardando logs de processamento...
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};