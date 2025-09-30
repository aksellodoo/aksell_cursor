import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePendingAccessRequests } from '@/hooks/usePendingAccessRequests';
import { usePermissions } from '@/hooks/usePermissions';
import { AccessRequestApprovalModal } from './AccessRequestApprovalModal';
import { LoadingSpinner } from './LoadingSpinner';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  UserPlus, 
  Clock, 
  Mail, 
  Building, 
  Shield,
  AlertTriangle,
  Play 
} from 'lucide-react';

export const AccessRequestsPendingList = () => {
  const { canModify } = usePermissions();
  const canApprove = canModify('Solicitações de Acesso');
  const { requests, loading, refetch } = usePendingAccessRequests(canApprove);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleRequestClick = (request: any) => {
    setSelectedRequest(request);
    setModalOpen(true);
  };

  const handleRequestProcessed = () => {
    refetch();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // Se o usuário não pode aprovar, não mostrar nada
  if (!canApprove) {
    return null;
  }

  // Se não há solicitações, não mostrar o card
  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => {
        const isExpiringSoon = new Date(request.expires_at) < new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        return (
          <Card 
            key={request.id} 
            className="hover:shadow-md transition-shadow animate-fade-in border-l-4 border-l-amber-500"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                {/* Left side - Request info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Solicitação de Acesso</Badge>
                        {isExpiringSoon && (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Expira em breve
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-base">{request.name}</h3>
                    </div>
                  </div>

                  {/* Request metadata - unified with forms style */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{request.email}</span>
                    <span>•</span>
                    <span>{request.department}</span>
                    <span>•</span>
                    <span>Cargo: {request.role}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        Criado {formatDistanceToNow(new Date(request.created_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Expiry warning */}
                  {isExpiringSoon && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-2 rounded border border-amber-200 dark:border-amber-800">
                      ⚠️ Esta solicitação expira em {format(new Date(request.expires_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  )}
                </div>

                {/* Right side - Action button */}
                <div className="flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleRequestClick(request)}
                    className="gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Processar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <AccessRequestApprovalModal
        request={selectedRequest}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onRequestProcessed={handleRequestProcessed}
      />
    </div>
  );
};