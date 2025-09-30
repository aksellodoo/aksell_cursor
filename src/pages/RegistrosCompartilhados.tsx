import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useSharedRecords } from "@/hooks/useSharedRecords";
import { PermissionGuard } from "@/components/PermissionGuard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { RecordSharingDashboard } from "@/components/RecordSharingDashboard";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  MoreHorizontal, 
  Share2, 
  Eye, 
  Trash2, 
  Calendar,
  User,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const getRecordTypeLabel = (recordType: string) => {
  const labels: Record<string, string> = {
    'user': 'Usuário',
    'department': 'Departamento', 
    'task': 'Tarefa',
    'employee': 'Funcionário',
    'client': 'Cliente',
    'project': 'Projeto'
  };
  return labels[recordType] || recordType;
};

const getStatusBadge = (status: string, expiresAt?: string) => {
  if (status === 'revoked') {
    return <Badge variant="destructive">Revogado</Badge>;
  }
  
  if (expiresAt && new Date(expiresAt) < new Date()) {
    return <Badge variant="secondary">Expirado</Badge>;
  }
  
  return <Badge variant="default">Ativo</Badge>;
};

const getRecordUrl = (recordType: string, recordId: string) => {
  const routes: Record<string, string> = {
    'user': `/usuarios/${recordId}`,
    'department': `/departamentos/${recordId}`,
    'task': `/tasks/${recordId}`,
    'employee': `/employees/${recordId}`
  };
  return routes[recordType] || `/shared/${recordType}/${recordId}`;
};

export default function RegistrosCompartilhados() {
  const navigate = useNavigate();
  const { sharedWithMe, sharedByMe, loading, revokeShare } = useSharedRecords();
  const [activeTab, setActiveTab] = useState("shared-with-me");

  const handleRevokeShare = async (shareId: string) => {
    if (confirm('Tem certeza que deseja revogar este compartilhamento?')) {
      await revokeShare(shareId);
    }
  };

  const handleViewRecord = (recordType: string, recordId: string) => {
    const url = getRecordUrl(recordType, recordId);
    navigate(url);
  };

  const renderTable = (records: any[], isSharedByMe: boolean = false) => {
    if (records.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Share2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">
            {isSharedByMe ? 'Nenhum registro compartilhado' : 'Nenhum registro compartilhado com você'}
          </p>
          <p className="text-sm">
            {isSharedByMe 
              ? 'Você ainda não compartilhou nenhum registro.' 
              : 'Você ainda não recebeu nenhum compartilhamento.'}
          </p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Nome do Registro</TableHead>
            <TableHead>{isSharedByMe ? 'Compartilhado com' : 'Compartilhado por'}</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Permissões</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell>
                <Badge variant="outline">
                  {getRecordTypeLabel(record.record_type)}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
                {record.record_name}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {isSharedByMe ? record.shared_with_name : record.shared_by_name}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDistanceToNow(new Date(record.shared_at), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(record.status, record.expires_at)}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {record.permissions.map((permission: string) => (
                    <Badge key={permission} variant="secondary" className="text-xs">
                      {permission === 'view' ? 'Visualizar' : 
                       permission === 'edit' ? 'Editar' : permission}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => handleViewRecord(record.record_type, record.record_id)}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ver Registro
                    </DropdownMenuItem>
                    {isSharedByMe && record.status === 'active' && (
                      <DropdownMenuItem 
                        onClick={() => handleRevokeShare(record.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Revogar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </PageLayout>
    );
  }

  return (
    <PermissionGuard pageName="Registros Compartilhados" action="view">
      <PageLayout>
        <div className="space-y-6">
          {/* Dashboard Overview */}
          <RecordSharingDashboard />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Detalhes dos Compartilhamentos
              </CardTitle>
              <CardDescription>
                Visualização detalhada de todos os registros compartilhados
              </CardDescription>
            </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="shared-with-me" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Compartilhados comigo/meu time
                  {sharedWithMe.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {sharedWithMe.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="shared-by-me" className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Compartilhados por mim/meu time
                  {sharedByMe.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {sharedByMe.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="shared-with-me" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">
                      Registros compartilhados comigo e com minha equipe
                    </h3>
                  </div>
                  {renderTable(sharedWithMe, false)}
                </div>
              </TabsContent>
              
              <TabsContent value="shared-by-me" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">
                      Registros compartilhados por mim e por minha equipe
                    </h3>
                  </div>
                  {renderTable(sharedByMe, true)}
                </div>
              </TabsContent>
            </Tabs>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    </PermissionGuard>
  );
}