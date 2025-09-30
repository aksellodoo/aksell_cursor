import { useState } from "react";
import { Plus, Settings, Shield, Users, Eye, Edit, Trash2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface Permission {
  id: string;
  name: string;
  description: string;
  level: "admin" | "manager" | "user" | "viewer";
  userCount: number;
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
    admin: boolean;
  };
  createdAt: string;
  isActive: boolean;
}

const mockPermissions: Permission[] = [
  {
    id: "1",
    name: "Administrador Geral",
    description: "Acesso completo a todas as funcionalidades do sistema",
    level: "admin",
    userCount: 3,
    permissions: { read: true, write: true, delete: true, admin: true },
    createdAt: "2024-01-01",
    isActive: true
  },
  {
    id: "2",
    name: "Gerente de Nutrição",
    description: "Acesso a relatórios e gestão de dados nutricionais",
    level: "manager", 
    userCount: 5,
    permissions: { read: true, write: true, delete: false, admin: false },
    createdAt: "2024-01-05",
    isActive: true
  },
  {
    id: "3",
    name: "Analista de Qualidade",
    description: "Visualização e análise de dados de qualidade",
    level: "user",
    userCount: 8,
    permissions: { read: true, write: true, delete: false, admin: false },
    createdAt: "2024-01-08",
    isActive: true
  },
  {
    id: "4",
    name: "Supervisor de Produção",
    description: "Controle de processos produtivos e relatórios",
    level: "manager",
    userCount: 4,
    permissions: { read: true, write: true, delete: false, admin: false },
    createdAt: "2024-01-10",
    isActive: true
  },
  {
    id: "5",
    name: "Visualizador",
    description: "Acesso somente leitura aos relatórios básicos",
    level: "viewer",
    userCount: 6,
    permissions: { read: true, write: false, delete: false, admin: false },
    createdAt: "2024-01-12",
    isActive: false
  }
];

export const Permissions = () => {
  const [permissions] = useState<Permission[]>(mockPermissions);

  const getLevelBadge = (level: Permission["level"]) => {
    const levelConfig = {
      admin: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: Shield },
      manager: { color: "bg-primary/10 text-primary border-primary/20", icon: Settings },
      user: { color: "bg-accent/10 text-accent border-accent/20", icon: Users },
      viewer: { color: "bg-secondary/50 text-secondary-foreground border-secondary/30", icon: Eye }
    };

    const config = levelConfig[level];
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {level === "admin" ? "Administrador" :
         level === "manager" ? "Gerente" :
         level === "user" ? "Usuário" : "Visualizador"}
      </Badge>
    );
  };

  const getPermissionIcon = (hasPermission: boolean, type: string) => {
    const icons = {
      read: Eye,
      write: Edit,
      delete: Trash2,
      admin: Shield
    };
    
    const Icon = icons[type as keyof typeof icons];
    
    return (
      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
        hasPermission 
          ? "bg-success/10 text-success" 
          : "bg-muted/50 text-muted-foreground"
      }`}>
        <Icon className="w-4 h-4" />
      </div>
    );
  };

  const totalUsers = permissions.reduce((sum, perm) => sum + perm.userCount, 0);
  const activePermissions = permissions.filter(p => p.isActive).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Permissões de Acesso</h1>
          <p className="text-muted-foreground">
            Configure níveis de acesso e permissões para diferentes tipos de usuários
          </p>
        </div>

        <div className="flex justify-end">
          <Button className="bg-gradient-primary text-primary-foreground shadow-primary hover:shadow-glow transition-all duration-300">
            <Plus className="mr-2 h-4 w-4" />
            Nova Permissão
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card border-0 bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Perfis</p>
                <p className="text-2xl font-bold text-foreground">{permissions.length}</p>
              </div>
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Perfis Ativos</p>
                <p className="text-2xl font-bold text-success">{activePermissions}</p>
              </div>
              <Shield className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Usuários Totais</p>
                <p className="text-2xl font-bold text-accent">{totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Níveis de Acesso</p>
                <p className="text-2xl font-bold text-primary">4</p>
              </div>
              <Settings className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permissions List */}
      <div className="space-y-4">
        {permissions.map((permission) => (
          <Card 
            key={permission.id} 
            className={`shadow-card border-0 bg-gradient-card transition-all duration-300 hover:shadow-glow ${
              !permission.isActive ? 'opacity-60' : ''
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-foreground">{permission.name}</CardTitle>
                    {getLevelBadge(permission.level)}
                    <Badge variant={permission.isActive ? "default" : "secondary"} className="text-xs">
                      {permission.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <CardDescription className="max-w-2xl">
                    {permission.description}
                  </CardDescription>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{permission.userCount} usuário(s)</span>
                    <span>•</span>
                    <span>Criado em {new Date(permission.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch checked={permission.isActive} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar permissão
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Users className="mr-2 h-4 w-4" />
                        Ver usuários
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Shield className="mr-2 h-4 w-4" />
                        Duplicar perfil
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remover permissão
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Permissões do Sistema</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3">
                      {getPermissionIcon(permission.permissions.read, "read")}
                      <div>
                        <p className="text-sm font-medium text-foreground">Leitura</p>
                        <p className="text-xs text-muted-foreground">Visualizar dados</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getPermissionIcon(permission.permissions.write, "write")}
                      <div>
                        <p className="text-sm font-medium text-foreground">Escrita</p>
                        <p className="text-xs text-muted-foreground">Criar e editar</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getPermissionIcon(permission.permissions.delete, "delete")}
                      <div>
                        <p className="text-sm font-medium text-foreground">Exclusão</p>
                        <p className="text-xs text-muted-foreground">Remover dados</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getPermissionIcon(permission.permissions.admin, "admin")}
                      <div>
                        <p className="text-sm font-medium text-foreground">Administração</p>
                        <p className="text-xs text-muted-foreground">Gerenciar sistema</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};