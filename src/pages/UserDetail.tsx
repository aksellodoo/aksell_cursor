import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, User, Mail, Building, Crown, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

import { PageLayout } from "@/components/PageLayout";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  last_login: string | null;
  department_id: string | null;
  is_leader: boolean;
  created_at: string;
  updated_at: string;
  department?: {
    name: string;
    color: string;
  };
}

export const UserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchUser(id);
    }
  }, [id]);

  const fetchUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          department:departments(name, color)
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUser({
        ...data,
        status: data.status as "active" | "inactive"
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do usuário",
        variant: "destructive",
      });
      navigate('/usuarios');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      "admin": { label: "Administrador", className: "bg-primary/10 text-primary border-primary/20" },
      "director": { label: "Diretor da Empresa", className: "bg-accent/10 text-accent border-accent/20" },
      "hr": { label: "RH", className: "bg-secondary/50 text-secondary-foreground border-secondary/30" },
      "user": { label: "Usuário Normal", className: "bg-warning/10 text-warning border-warning/20" }
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
      <PageLayout>
        <LoadingSpinner />
      </PageLayout>
    );
  }

  if (!user) {
    return (
      <PageLayout>
        <div className="text-center py-8">
          <p>Usuário não encontrado</p>
          <Button onClick={() => navigate('/usuarios')} className="mt-4">
            Voltar para usuários
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/usuarios')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Detalhes do Usuário</h1>
          <p className="text-muted-foreground">
            Informações completas de {user.name}
          </p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => navigate(`/usuarios/${user.id}/edit`)}
        >
          <Edit className="h-4 w-4" />
          Editar
        </Button>
      </div>

      {/* User Profile Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-xl">{user.name}</CardTitle>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {getRoleBadge(user.role)}
                <Badge 
                  variant={user.status === 'active' ? 'default' : 'secondary'}
                  className={user.status === 'active' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}
                >
                  {user.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
                {user.is_leader && (
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                    <Crown className="w-3 h-3 mr-1" />
                    Líder
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Informações de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-foreground">{user.email}</p>
            </div>
            <Separator />
            <div>
              <label className="text-sm font-medium text-muted-foreground">Último Login</label>
              <p className="text-foreground">
                {user.last_login 
                  ? new Date(user.last_login).toLocaleString('pt-BR') 
                  : 'Nunca logou'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Organization Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Informações Organizacionais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Departamento</label>
              <div className="flex items-center gap-2 mt-1">
                {user.department && (
                  <div 
                    className="w-3 h-3 rounded-full border" 
                    style={{ backgroundColor: user.department.color }}
                  />
                )}
                <p className="text-foreground">
                  {user.department?.name || 'Sem departamento'}
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <label className="text-sm font-medium text-muted-foreground">Função</label>
              <p className="text-foreground">{getRoleBadge(user.role)}</p>
            </div>
            <Separator />
            <div>
              <label className="text-sm font-medium text-muted-foreground">Posição</label>
              <p className="text-foreground">
                {user.is_leader ? 'Líder de equipe' : 'Membro da equipe'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Informações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Data de Criação</label>
              <p className="text-foreground">
                {new Date(user.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Última Atualização</label>
              <p className="text-foreground">
                {new Date(user.updated_at).toLocaleString('pt-BR')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};