import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { usePendingAccessRequests } from '@/hooks/usePendingAccessRequests';
import { AccessRequestApprovalModal } from './AccessRequestApprovalModal';
import { LoadingSpinner } from './LoadingSpinner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  UserPlus, 
  Search, 
  Clock, 
  Mail, 
  Building, 
  Filter,
  RefreshCw 
} from 'lucide-react';

export const AccessRequestsList = () => {
  const { requests, loading, refetch } = usePendingAccessRequests();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRequests = requests.filter(request =>
    request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRequestClick = (request: any) => {
    setSelectedRequest(request);
    setModalOpen(true);
  };

  const handleRequestProcessed = () => {
    refetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Solicitações de Acesso</h2>
          <p className="text-muted-foreground">
            Gerencie as solicitações de acesso ao sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {filteredRequests.length} pendente(s)
          </Badge>
          <Button
            variant="outline"
            size="icon"
            onClick={refetch}
            className="h-9 w-9"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou departamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {searchTerm ? 'Nenhuma solicitação encontrada' : 'Nenhuma solicitação pendente'}
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              {searchTerm 
                ? 'Tente ajustar os termos de busca ou limpar os filtros.'
                : 'Quando houver solicitações de acesso pendentes, elas aparecerão aqui.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request) => (
            <Card 
              key={request.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleRequestClick(request)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    {request.name}
                  </CardTitle>
                  <Badge 
                    variant={request.status === 'pending' ? 'default' : 'secondary'}
                    className="flex items-center gap-1"
                  >
                    <Clock className="h-3 w-3" />
                    {request.status === 'pending' ? 'Pendente' : request.status}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {request.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    {request.department}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Cargo: <strong>{request.role}</strong></span>
                  <span>
                    Solicitado em {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </span>
                </div>
                {new Date(request.expires_at) < new Date(Date.now() + 24 * 60 * 60 * 1000) && (
                  <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    ⚠️ Expira em {format(new Date(request.expires_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approval Modal */}
      <AccessRequestApprovalModal
        request={selectedRequest}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onRequestProcessed={handleRequestProcessed}
      />
    </div>
  );
};