
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCityDistanceCalculation } from "@/hooks/useCityDistanceCalculation";
import { X, AlertTriangle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { DistanceErrorsModal } from "./DistanceErrorsModal";

interface DistanceProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DistanceProgressModal({ open, onOpenChange }: DistanceProgressModalProps) {
  const { 
    currentJob, 
    jobErrors,
    isJobRunning, 
    progressPercentage, 
    getPhaseProgress,
    estimatedRemainingMinutes,
    isJobStalled,
    minutesSinceLastUpdate,
    cancelCalculation,
    forceResume,
    refetchErrors,
    isCancelling,
    isForceResuming 
  } = useCityDistanceCalculation();

  const [showErrorsModal, setShowErrorsModal] = useState(false);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleCloseAndContinue = () => {
    onOpenChange(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'cancelled': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'cancelled': return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'queued': return 'Na fila';
      case 'running': return 'Em execução';
      case 'completed': return 'Concluído';
      case 'failed': return 'Falhado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (!currentJob) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Cálculo de Distâncias
              <Badge 
                variant="secondary" 
                className={`${getStatusColor(currentJob.status)} text-white`}
              >
                <div className="flex items-center gap-1">
                  {getStatusIcon(currentJob.status)}
                  {getStatusText(currentJob.status)}
                </div>
              </Badge>
            </DialogTitle>
            <DialogDescription>
              {currentJob.mode === 'geocode_non_matrix'
                ? "Geocodificando e calculando distâncias para cidades sem matrix"
                : currentJob.only_fill_empty || currentJob.mode === 'fill_empty'
                  ? "Preenchendo apenas campos vazios" 
                  : "Recalculando todas as distâncias"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{getPhaseProgress()}</span>
                {isJobRunning && (
                  <span>
                    {isJobStalled ? (
                      <span className="text-orange-600">
                        Sem progresso há {minutesSinceLastUpdate} min
                      </span>
                    ) : estimatedRemainingMinutes && currentJob.phase === 'matrix' ? (
                      `~${estimatedRemainingMinutes} min restantes`
                    ) : (
                      'Calculando tempo estimado...'
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold">{currentJob.total_cities}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Processadas</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold text-green-600">
                    {currentJob.processed_cities}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Geocodificadas</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold text-blue-600">
                    {currentJob.geocoded_cities || 0}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Falhadas</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold text-red-600">
                    {currentJob.failed_cities || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Errors Section */}
            {currentJob.failed_cities > 0 && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="h-4 w-4" />
                    Erros Encontrados
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-yellow-600">
                        {currentJob.failed_cities}
                      </span>
                      {jobErrors?.some(error => error.payload?.is_temporary_failure) && (
                        <p className="text-xs text-yellow-700 mt-1">
                          Inclui falhas temporárias que podem ser resolvidas
                        </p>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowErrorsModal(true)}
                      className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Message */}
            {currentJob.status === 'failed' && currentJob.error_message && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-4">
                  <p className="text-sm text-red-800">{currentJob.error_message}</p>
                </CardContent>
              </Card>
            )}

            {/* Stall Warning */}
            {isJobStalled && currentJob?.status === 'running' && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                <div className="text-sm text-orange-800">
                  <strong>Processo travado:</strong> Sem progresso há {minutesSinceLastUpdate} minutos. 
                  Você pode tentar retomar o processamento ou cancelar e reiniciar.
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              {isJobRunning && (
                <>
                  <Button 
                    variant="destructive" 
                    onClick={() => cancelCalculation.mutate()}
                    disabled={isCancelling}
                    className="flex-1"
                  >
                    {isCancelling ? "Cancelando..." : "Cancelar"}
                  </Button>
                  
                   <Button 
                     variant="secondary" 
                     onClick={() => forceResume.mutate()}
                     disabled={isForceResuming}
                     className="flex-1"
                   >
                     {isForceResuming ? "Retomando..." : "Forçar retomar agora"}
                   </Button>
                  
                  {!isJobStalled && (
                    <Button 
                      variant="outline"
                      onClick={handleCloseAndContinue}
                      className="flex-1"
                    >
                      Continuar em segundo plano
                    </Button>
                  )}
                </>
              )}

              {!isJobRunning && (
                <Button 
                  variant="default"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Fechar
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DistanceErrorsModal
        open={showErrorsModal}
        onOpenChange={(open) => {
          if (open) {
            refetchErrors(); // Refresh errors when modal opens
          }
          setShowErrorsModal(open);
        }}
        errors={jobErrors || []}
        jobId={currentJob?.id}
      />
    </>
  );
}
