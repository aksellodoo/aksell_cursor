import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Share2, Clock, Users, Eye, AlertTriangle } from 'lucide-react';
import { useSharedRecords } from '@/hooks/useSharedRecords';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const RecordSharingDashboard = () => {
  const { sharedWithMe, sharedByMe, loading } = useSharedRecords();
  const navigate = useNavigate();

  const getRecordUrl = (recordType: string, recordId: string) => {
    switch (recordType) {
      case 'user':
        return `/usuarios/${recordId}`;
      case 'department':
        return `/departamentos`;
      case 'task':
        return `/tasks`;
      case 'employee':
        return `/funcionarios`;
      default:
        return '/';
    }
  };

  const getRecordTypeLabel = (recordType: string) => {
    const labels = {
      user: 'Usuário',
      department: 'Departamento',
      task: 'Tarefa',
      employee: 'Funcionário'
    };
    return labels[recordType as keyof typeof labels] || recordType;
  };

  const getStatusColor = (status: string, expiresAt?: string) => {
    if (status === 'revoked') return 'destructive';
    if (expiresAt && new Date(expiresAt) < new Date()) return 'secondary';
    return 'default';
  };

  const expiringShares = sharedByMe.filter(share => 
    share.expires_at && 
    new Date(share.expires_at) > new Date() && 
    new Date(share.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
  );

  if (loading) {
    return <div>Carregando dados de compartilhamento...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compartilhados comigo</p>
                <p className="text-2xl font-bold text-primary">{sharedWithMe.length}</p>
              </div>
              <Eye className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compartilhados por mim</p>
                <p className="text-2xl font-bold text-accent">{sharedByMe.length}</p>
              </div>
              <Share2 className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pessoas alcançadas</p>
                <p className="text-2xl font-bold text-success">
                  {new Set(sharedByMe.map(s => s.shared_with)).size}
                </p>
              </div>
              <Users className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expirando em 7 dias</p>
                <p className="text-2xl font-bold text-warning">{expiringShares.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Shares */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shared with me */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Compartilhados Comigo
            </CardTitle>
            <CardDescription>
              Registros que outros usuários compartilharam com você
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sharedWithMe.slice(0, 5).map((share) => (
                <div key={share.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{share.record_name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {getRecordTypeLabel(share.record_type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Compartilhado por {share.shared_by_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(share.shared_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(share.status, share.expires_at)}>
                      {share.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(getRecordUrl(share.record_type, share.record_id))}
                    >
                      Ver
                    </Button>
                  </div>
                </div>
              ))}
              {sharedWithMe.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum registro compartilhado com você ainda.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Shared by me */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Compartilhados por Mim
            </CardTitle>
            <CardDescription>
              Registros que você compartilhou com outros usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sharedByMe.slice(0, 5).map((share) => (
                <div key={share.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{share.record_name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {getRecordTypeLabel(share.record_type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Compartilhado com {share.shared_with_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(share.shared_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                    {share.expires_at && (
                      <p className="text-xs text-warning">
                        Expira {formatDistanceToNow(new Date(share.expires_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(share.status, share.expires_at)}>
                      {share.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(getRecordUrl(share.record_type, share.record_id))}
                    >
                      Ver
                    </Button>
                  </div>
                </div>
              ))}
              {sharedByMe.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Você ainda não compartilhou nenhum registro.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={() => navigate('/registros-compartilhados')}>
              Ver todos os compartilhamentos
            </Button>
            <Button variant="outline" onClick={() => navigate('/usuarios')}>
              Compartilhar usuário
            </Button>
            <Button variant="outline" onClick={() => navigate('/departamentos')}>
              Compartilhar departamento
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};