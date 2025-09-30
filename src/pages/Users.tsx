import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MoreHorizontal, UserCheck, UserX, Calendar, Crown, User, MessageCircle, Clock, Eye, Settings, Building, Trash2, Key, Share2, ShieldCheck, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CreateUserModal } from "@/components/CreateUserModal";
import { UserHistoryModal } from '@/components/UserHistoryModal';

import { ChatterComponent } from '@/components/ChatterComponent';
import { ChatterAccess } from '@/components/ChatterAccess';
import { ChatterIndicator } from '@/components/ChatterIndicator';
import { useChatterNavigation } from '@/hooks/useChatterNavigation';
import { PermissionGuard } from "@/components/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { PageLayout } from "@/components/PageLayout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ShareButton } from "@/components/ShareButton";
import { AccessRejectionsTable } from "@/components/AccessRejectionsTable";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  last_login: string | null;
  department_id: string | null;
  is_leader: boolean;
  department?: {
    name: string;
    color: string;
  };
  created_at?: string;
  updated_at?: string;
  mfa_required?: boolean; // novo campo para exibir/alternar 2FA
}

export const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<{ id: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState("users");
  
  const { canModify, userProfile } = usePermissions();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { openChatter } = useChatterNavigation();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          department:departments(name, color)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers((data || []).map((user: any) => ({
        ...user,
        status: user.status as "active" | "inactive",
        mfa_required: !!user.mfa_required,
      })));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: User["status"]) => {
    return status === "active" ? (
      <Badge className="bg-success/10 text-success border-success/20">
        <UserCheck className="w-3 h-3 mr-1" />
        Ativo
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20">
        <UserX className="w-3 h-3 mr-1" />
        Inativo
      </Badge>
    );
  };


  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getUserTypeBadge = (role: string, isLeader: boolean) => {
    if (role === 'user') {
      if (isLeader) {
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <Crown className="w-3 h-3 mr-1" />
            usuario lider
          </Badge>
        );
      }
      return (
        <Badge variant="outline" className="bg-muted/20 text-muted-foreground border-muted/30">
          <User className="w-3 h-3 mr-1" />
          usuario
        </Badge>
      );
    }
    if (role === 'hr') {
      return (
        <Badge className="bg-secondary/50 text-secondary-foreground border-secondary/30">
          rh
        </Badge>
      );
    }
    if (role === 'director') {
      return (
        <Badge className="bg-accent/10 text-accent border-accent/20">
          diretor
        </Badge>
      );
    }
    if (role === 'admin') {
      return (
        <Badge className="bg-primary/10 text-primary border-primary/20">
          administrador
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-muted/20 text-muted-foreground border-muted/30">
        {role}
      </Badge>
    );
  };

  const navigate = useNavigate();

  const handleEditUser = (user: User) => {
    // Navegar para a nova tela de edição
    navigate(`/usuarios/${user.id}/edit`);
  };

  const handleViewHistory = (user: User) => {
    setSelectedUserForHistory({ id: user.id, name: user.name });
    setIsHistoryModalOpen(true);
  };

  const handleCloseHistoryModal = () => {
    setIsHistoryModalOpen(false);
    setSelectedUserForHistory(null);
  };

  const handlePasswordReset = async (user: User) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset-link', {
        body: {
          email: user.email,
          resetType: 'admin_forced',
          adminId: (currentUser as any)?.id
        }
      });

      if (error) throw error;

      toast({
        title: "Reset de senha enviado",
        description: `Email de redefinição de senha foi enviado para ${user.email}`,
      });
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar email de reset de senha",
        variant: "destructive",
      });
    }
  };

  const handleAdminResetMfa = async (user: User) => {
    const confirmed = window.confirm(`Remover 2FA (TOTP) do usuário ${user.name}?`);
    if (!confirmed) return;
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-mfa', {
        body: { target_user_id: user.id }
      });
      if (error) throw error;
      toast({
        title: "2FA removido",
        description: `Fatores TOTP removidos para ${user.name}`,
      });
      fetchUsers();
    } catch (e) {
      console.error('Error resetting MFA:', e);
      toast({
        title: "Erro",
        description: "Falha ao resetar 2FA do usuário",
        variant: "destructive",
      });
    }
  };

  // Alternar 2FA requerido por usuário (admin/director)
  const handleToggleMfaRequired = async (user: User) => {
    const newValue = !user.mfa_required;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          mfa_required: newValue,
          mfa_enforced_at: newValue ? new Date().toISOString() : null
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating mfa_required:', error);
        toast({
          title: "Erro",
          description: "Erro ao alterar exigência de 2FA: " + (error as any).message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: `2FA ${newValue ? "passou a ser requerido" : "deixou de ser requerido"} para ${user.name}`,
      });

      fetchUsers();
    } catch (e) {
      console.error('Error toggling mfa_required:', e);
      toast({
        title: "Erro",
        description: "Erro inesperado ao configurar 2FA",
        variant: "destructive",
      });
    }
  };

  const handleResendWelcomeEmail = async (user: User) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          userEmail: user.email,
          userName: user.name,
          userId: user.id,
          createdBy: currentUser?.id
        }
      });

      if (error) throw error;

      toast({
        title: "E-mail reenviado",
        description: `E-mail de boas-vindas enviado para ${user.email}`,
      });
    } catch (error) {
      console.error('Error resending welcome email:', error);
      toast({
        title: "Erro",
        description: "Erro ao reenviar e-mail de boas-vindas",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (user: User) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { targetUserId: user.id }
      });

      if (error) {
        toast({
          title: "Erro",
          description: error.message || "Erro ao excluir usuário",
          variant: "destructive",
        });
        return;
      }

      // Use the message returned by the function
      toast({
        title: "Usuário excluído",
        description: data?.message || `O usuário ${user.name} foi excluído com sucesso.`,
      });

      // Refresh the users list
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao excluir usuário",
        variant: "destructive",
      });
    }
  };


  // Verificar se o usuário é admin/director para mostrar aba de rejeições
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'director';

  return (
    <PermissionGuard pageName="Usuários" action="view">
      <PageLayout>
        {/* Tabs */}
        <div className="ml-16">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="users">Usuários</TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="rejections">Rejeições</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="users" className="mt-6">
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuários..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  <PermissionGuard pageName="Usuários" action="modify" hideWhenNoAccess>
                    <CreateUserModal onUserCreated={fetchUsers} />
                  </PermissionGuard>
                  
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="shadow-card border-0 bg-gradient-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total de Usuários</p>
                        <p className="text-2xl font-bold text-foreground">{users.length}</p>
                      </div>
                      <UserCheck className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card border-0 bg-gradient-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                        <p className="text-2xl font-bold text-success">
                          {users.filter(u => u.status === "active").length}
                        </p>
                      </div>
                      <UserCheck className="h-8 w-8 text-success" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card border-0 bg-gradient-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Usuários Inativos</p>
                        <p className="text-2xl font-bold text-destructive">
                          {users.filter(u => u.status === "inactive").length}
                        </p>
                      </div>
                      <UserX className="h-8 w-8 text-destructive" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card border-0 bg-gradient-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Departamentos</p>
                        <p className="text-2xl font-bold text-accent">
                          {new Set(users.map(u => u.department?.name).filter(Boolean)).size}
                        </p>
                      </div>
                      <Calendar className="h-8 w-8 text-accent" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Users Table */}
              <Card className="shadow-card border-0 bg-gradient-card">
                <CardHeader>
                  <CardTitle>Lista de Usuários</CardTitle>
                  <CardDescription>
                    {filteredUsers.length} usuário(s) encontrado(s)
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserX className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>Nenhum usuário encontrado</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Departamento</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Tipo de Usuário</TableHead>
                          <TableHead>2FA</TableHead>
                          
                          <TableHead>Último Login</TableHead>
                          <TableHead className="w-[50px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => {
                          const UserRowContent = () => {
                            
                            
                            return (
                              <TableRow key={user.id} className="hover:bg-muted/30">
                                <TableCell>
                                  <div className="flex items-center space-x-3">
                                    <Avatar className="h-10 w-10">
                                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                        {getInitials(user.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium text-foreground">{user.name}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">{user.email}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    {user.department && (
                                      <div 
                                        className="w-4 h-4 rounded-full border border-border" 
                                        style={{ backgroundColor: (user as any).department?.color }}
                                      />
                                    )}
                                    <span className="text-sm">
                                      {user.department?.name || "Sem departamento"}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(user.status)}
                                </TableCell>
                                <TableCell>
                                  {getUserTypeBadge(user.role, user.is_leader)}
                                </TableCell>
                                <TableCell>
                                  {user.mfa_required ? (
                                    <Badge className="bg-primary/10 text-primary border-primary/20">
                                      Requerido
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-muted/20 text-muted-foreground border-muted/30">
                                      Opcional
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col space-y-1">
                                    <div className="text-sm text-muted-foreground">
                                      {user.last_login ? new Date(user.last_login).toLocaleDateString('pt-BR') : 'Nunca'}
                                    </div>
                                    <ChatterIndicator
                                      recordType="user"
                                      recordId={user.id}
                                      recordName={user.name}
                                      showBadge={false}
                                      clickable={true}
                                      className="text-xs"
                                    />
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <PermissionGuard pageName="Usuários" action="modify" hideWhenNoAccess>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => navigate(`/usuarios/${user.id}`)}>
                                          <Eye className="mr-2 h-4 w-4" />
                                          Ver detalhes
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                          Editar usuário
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          Alterar permissões
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleViewHistory(user)}>
                                          <Clock className="mr-2 h-4 w-4" />
                                          Ver histórico
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                          <div className="w-full">
                                            <ShareButton
                                              recordType="user"
                                              recordId={user.id}
                                              recordName={user.name}
                                              variant="ghost"
                                              size="sm"
                                              className="w-full justify-start p-0 h-auto"
                                              showText={true}
                                            />
                                          </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleToggleMfaRequired(user)}>
                                          <ShieldCheck className="mr-2 h-4 w-4" />
                                          {user.mfa_required ? "Tornar 2FA opcional" : "Exigir 2FA"}
                                        </DropdownMenuItem>
                                         { (userProfile?.role === 'admin' || userProfile?.role === 'director') && (
                                           <>
                                             <DropdownMenuItem onClick={() => handlePasswordReset(user)}>
                                               <Key className="mr-2 h-4 w-4" />
                                               Reset de senha
                                             </DropdownMenuItem>
                                             <DropdownMenuItem onClick={() => handleResendWelcomeEmail(user)}>
                                               <Mail className="mr-2 h-4 w-4" />
                                               Reenviar e-mail de boas-vindas
                                             </DropdownMenuItem>
                                             <DropdownMenuItem onClick={() => handleAdminResetMfa(user)}>
                                               <ShieldCheck className="mr-2 h-4 w-4" />
                                               Resetar 2FA
                                             </DropdownMenuItem>
                                           </>
                                         )}
                                        <DropdownMenuItem onClick={() => openChatter({ recordType: 'user', recordId: user.id, recordName: user.name })}>
                                          <MessageCircle className="mr-2 h-4 w-4" />
                                          Chatter
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          className="text-destructive"
                                          onClick={() => {
                                            const newStatus = user.status === "active" ? "inactive" : "active";
                                            (async () => {
                                              try {
                                                const { error } = await supabase
                                                  .from('profiles')
                                                  .update({ status: newStatus })
                                                  .eq('id', user.id);
                                                if (error) throw error;
                                                toast({
                                                  title: "Sucesso",
                                                  description: `Usuário ${user.name} foi ${newStatus === "active" ? "ativado" : "desativado"} com sucesso`,
                                                });
                                                fetchUsers();
                                              } catch (e) {
                                                console.error('Error updating user status:', e);
                                                toast({
                                                  title: "Erro",
                                                  description: "Erro inesperado ao alterar status do usuário",
                                                  variant: "destructive",
                                                });
                                              }
                                            })();
                                          }}
                                        >
                                          {user.status === "active" ? "Desativar" : "Ativar"} usuário
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                         <AlertDialog>
                                           <AlertDialogTrigger asChild>
                                             <DropdownMenuItem 
                                               className="text-destructive focus:text-destructive"
                                               onSelect={(e) => e.preventDefault()}
                                             >
                                               <Trash2 className="mr-2 h-4 w-4" />
                                               Excluir usuário
                                             </DropdownMenuItem>
                                           </AlertDialogTrigger>
                                           <AlertDialogContent>
                                             <AlertDialogHeader>
                                               <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
                                               <AlertDialogDescription>
                                                 Tem certeza que deseja excluir o usuário <strong>{user.name}</strong>? 
                                                 Esta ação não pode ser desfeita.
                                               </AlertDialogDescription>
                                             </AlertDialogHeader>
                                             <AlertDialogFooter>
                                               <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                               <AlertDialogAction
                                                 onClick={() => handleDeleteUser(user)}
                                                 className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                               >
                                                 Excluir
                                               </AlertDialogAction>
                                             </AlertDialogFooter>
                                           </AlertDialogContent>
                                         </AlertDialog>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </PermissionGuard>
                                </TableCell>
                              </TableRow>
                            );
                          };
                          
                          return <UserRowContent key={user.id} />;
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {isAdmin && (
              <TabsContent value="rejections" className="mt-6">
                <AccessRejectionsTable />
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Chatter Component */}

        {/* Modals */}
        {isHistoryModalOpen && selectedUserForHistory && (
          <UserHistoryModal
            userId={selectedUserForHistory.id}
            userName={selectedUserForHistory.name}
            isOpen={isHistoryModalOpen}
            onClose={handleCloseHistoryModal}
          />
        )}
      </PageLayout>
    </PermissionGuard>
  );
};
