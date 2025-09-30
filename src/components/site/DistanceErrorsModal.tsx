import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, MapPin, Clock } from "lucide-react";

interface DistanceError {
  id: string;
  city_id: string;
  reason: string;
  payload: any;
  created_at: string;
  city?: {
    name: string;
    uf: string;
  };
}

interface DistanceErrorsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errors: DistanceError[];
  jobId?: string;
}

export function DistanceErrorsModal({
  open,
  onOpenChange,
  errors,
  jobId
}: DistanceErrorsModalProps) {
  
  const getErrorBadgeVariant = (reason: string, isTemporary?: boolean) => {
    if (isTemporary) {
      return 'secondary'; // Temporary failures get secondary styling
    }
    
    switch (reason) {
      case 'geocoding':
      case 'geocoding_failed':
        return 'destructive';
      case 'matrix_api_error':
        return 'destructive';
      case 'missing_coordinates':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getErrorDescription = (reason: string, isTemporary?: boolean, retryAttempts?: number) => {
    if (isTemporary && retryAttempts > 0) {
      return `Falha temporária (${retryAttempts} tentativas) - pode ser resolvida ao tentar novamente`;
    }
    
    switch (reason) {
      case 'geocoding':
      case 'geocoding_failed':
        return 'Erro ao obter coordenadas da cidade';
      case 'matrix_api_error':
        return 'Erro na API de matriz de distâncias';
      case 'missing_coordinates':
        return 'Coordenadas não disponíveis';
      default:
        return 'Erro desconhecido';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Log de Erros ({errors.length})
          </DialogTitle>
          <DialogDescription>
            Detalhes dos erros ocorridos durante o cálculo de distância
            {jobId && ` (Job: ${jobId.slice(0, 8)}...)`}
          </DialogDescription>
        </DialogHeader>

        {errors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum erro encontrado.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="space-y-3">
              {errors.map((error) => (
                <div 
                  key={error.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">
                          {error.city?.name || 'Cidade desconhecida'}
                        </h4>
                        {error.city?.uf && (
                          <Badge variant="outline" className="text-xs">
                            {error.city.uf}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {getErrorDescription(
                          error.reason, 
                          error.payload?.is_temporary_failure, 
                          error.payload?.retry_attempts
                        )}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Badge variant={getErrorBadgeVariant(error.reason, error.payload?.is_temporary_failure)}>
                        {error.reason}
                      </Badge>
                      {error.payload?.retry_attempts > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {error.payload.retry_attempts} tentativas
                        </Badge>
                      )}
                    </div>
                  </div>

                  {error.payload && Object.keys(error.payload).length > 0 && (
                    <div className="bg-muted p-2 rounded text-xs">
                      <strong>Detalhes:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">
                        {JSON.stringify(error.payload, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDate(error.created_at)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}