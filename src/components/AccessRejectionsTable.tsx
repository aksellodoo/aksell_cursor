import React, { useState } from 'react';
import { Search, Trash2, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAccessRejections, type AccessRejection } from '@/hooks/useAccessRejections';

export const AccessRejectionsTable: React.FC = () => {
  const { rejections, loading, deleteRejection } = useAccessRejections();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRejections = rejections.filter(rejection =>
    rejection.requester_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rejection.requester_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rejection.requested_department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rejection.requested_role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rejection.rejector?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      "admin": { label: "Administrador", className: "bg-primary/10 text-primary border-primary/20" },
      "director": { label: "Diretor", className: "bg-accent/10 text-accent border-accent/20" },
      "hr": { label: "RH", className: "bg-secondary/50 text-secondary-foreground border-secondary/30" },
      "user": { label: "Usuário", className: "bg-warning/10 text-warning border-warning/20" }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || { 
      label: role, 
      className: "bg-muted text-muted-foreground" 
    };

    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar rejeições..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card className="shadow-card border-0 bg-gradient-card">
        <CardHeader>
          <CardTitle>Rejeições de Acesso</CardTitle>
          <CardDescription>
            {filteredRejections.length} rejeição(ões) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredRejections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Eye className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nenhuma rejeição encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cargo Solicitado</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Motivo da Rejeição</TableHead>
                  <TableHead>Rejeitado por</TableHead>
                  <TableHead>Data da Rejeição</TableHead>
                  <TableHead className="w-[50px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRejections.map((rejection) => (
                  <TableRow key={rejection.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {rejection.requester_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{rejection.requester_email}</div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(rejection.requested_role)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{rejection.requested_department}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm max-w-xs truncate" title={rejection.rejection_reason}>
                        {rejection.rejection_reason || 'Não informado'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {rejection.rejector?.name || 'Sistema'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(rejection.rejected_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover Rejeição</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover esta rejeição? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteRejection(rejection.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};