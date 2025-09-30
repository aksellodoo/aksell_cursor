import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Clock, AlertTriangle, Download } from 'lucide-react';
import { SyncLog } from '@/hooks/useSyncStatusPolling';

interface SyncLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  syncLog: SyncLog | null;
}

export function SyncLogModal({ open, onOpenChange, syncLog }: SyncLogModalProps) {
  if (!syncLog) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getDuration = () => {
    if (!syncLog.started_at) return 'N/A';
    const start = new Date(syncLog.started_at);
    const end = syncLog.finished_at ? new Date(syncLog.finished_at) : new Date();
    const duration = Math.round((end.getTime() - start.getTime()) / 1000);
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon(syncLog.status)}
            Log de Sincronização
            <Badge className={getStatusColor(syncLog.status)}>
              {syncLog.status === 'completed' ? 'Concluída' : 
               syncLog.status === 'failed' ? 'Falhou' : 
               syncLog.status === 'running' ? 'Executando' : 'Desconhecido'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4">
            {/* Informações Gerais */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo de Sincronização</label>
                <p className="text-sm">
                  {syncLog.sync_type === 'manual' ? 'Manual' : 'Agendada'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Duração</label>
                <p className="text-sm">{getDuration()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Iniciado em</label>
                <p className="text-sm">{formatDate(syncLog.started_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Finalizado em</label>
                <p className="text-sm">{formatDate(syncLog.finished_at)}</p>
              </div>
            </div>

            <Separator />

            {/* Estatísticas */}
            <div>
              <h4 className="text-sm font-medium mb-2">Estatísticas de Processamento</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{syncLog.records_created}</div>
                  <div className="text-xs text-muted-foreground">Criados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{syncLog.records_updated}</div>
                  <div className="text-xs text-muted-foreground">Atualizados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{syncLog.records_deleted}</div>
                  <div className="text-xs text-muted-foreground">Deletados</div>
                </div>
              </div>
            </div>

            {/* Campos Binários Excluídos */}
            {syncLog.excluded_binary_fields && syncLog.excluded_binary_fields.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Campos Binários Excluídos desta Execução
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {syncLog.excluded_binary_fields.map((field) => (
                      <Badge key={field} variant="secondary" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Campos binários são baixados separadamente via /download/:id
                  </p>
                </div>
              </>
            )}

            {/* Erros de Download Binário */}
            {syncLog.binary_download_errors > 0 && (
              <>
                <Separator />
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {syncLog.binary_download_errors} erro(s) de download de arquivos binários detectado(s). 
                    Os dados principais foram sincronizados com sucesso.
                  </AlertDescription>
                </Alert>
              </>
            )}

            {/* Erro Geral */}
            {syncLog.error_message && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2 text-red-600">Mensagem de Erro</h4>
                  <Alert variant="destructive">
                    <AlertDescription className="text-xs">
                      {syncLog.error_message}
                    </AlertDescription>
                  </Alert>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}