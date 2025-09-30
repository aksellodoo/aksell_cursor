import { Users, Shield, Activity, FileText, Database, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useState } from "react";
import { useAuditStats } from "@/hooks/useAuditStats";
import { AuditLogCleanupModal } from "@/components/AuditLogCleanupModal";
import { useToast } from "@/hooks/use-toast";

interface DashboardProps {
  onLogout: () => void;
}

export const Dashboard = ({ onLogout }: DashboardProps) => {
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const { stats: auditStats, loading: auditLoading, refetch: refetchAuditStats, cleanOldLogs } = useAuditStats();
  const { toast } = useToast();
  const stats = [
    {
      title: "Usuários Ativos",
      value: "24",
      description: "Usuários com acesso ao sistema",
      icon: Users,
      trend: "+2 este mês"
    },
    {
      title: "Níveis de Acesso",
      value: "5",
      description: "Perfis de permissão configurados",
      icon: Shield,
      trend: "Estável"
    },
    {
      title: "Atividade Hoje",
      value: "47",
      description: "Acessos realizados hoje",
      icon: Activity,
      trend: "+15% vs ontem"
    },
    {
      title: "Documentos Seguros",
      value: "156",
      description: "Documentos protegidos",
      icon: FileText,
      trend: "+8 esta semana"
    },
    {
      title: "Log de Auditoria",
      value: auditLoading ? "..." : auditStats.sizeFormatted,
      description: `${auditStats.count} registros de alterações`,
      icon: Database,
      trend: `+${auditStats.monthlyGrowth} este mês`
    }
  ];

  const recentActivity = [
    {
      user: "Maria Silva",
      action: "Acessou relatórios de nutrição",
      time: "há 5 minutos",
      type: "access"
    },
    {
      user: "João Santos",
      action: "Criou novo usuário",
      time: "há 12 minutos", 
      type: "create"
    },
    {
      user: "Ana Costa",
      action: "Modificou permissões",
      time: "há 25 minutos",
      type: "modify"
    },
    {
      user: "Pedro Lima",
      action: "Fez login no sistema",
      time: "há 1 hora",
      type: "login"
    }
  ];

  const getActivityColor = (type: string) => {
    switch (type) {
      case "access": return "text-primary";
      case "create": return "text-success";
      case "modify": return "text-warning";
      case "login": return "text-muted-foreground";
      default: return "text-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/95 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-6">
            <Logo size="md" animated={true} variant="full" />
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard Principal</h1>
              <p className="text-sm text-muted-foreground font-medium">
                Bem-vindo ao FichaCerta - Sistema Aksell Nutrition
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8 space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {stats.map((stat, index) => (
            <Card 
              key={stat.title} 
              className="shadow-elegant border-0 bg-card/90 backdrop-blur-sm hover:shadow-glow transition-all duration-300 hover:scale-[1.02] animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground tracking-tight">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground mb-2 tracking-tight">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">
                  {stat.description}
                </p>
                <p className="text-xs text-primary font-semibold">
                  {stat.trend}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <Card className="shadow-elegant border-0 bg-card/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-foreground font-bold text-xl tracking-tight">Ações Rápidas</CardTitle>
              <CardDescription className="font-medium">
                Acesse rapidamente as principais funcionalidades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start bg-gradient-primary text-primary-foreground hover:shadow-primary transition-all duration-300 font-semibold py-3 rounded-xl button-press group">
                <Users className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                Gerenciar Usuários
              </Button>
              <Button variant="outline" className="w-full justify-start hover:bg-muted/50 transition-smooth font-medium py-3 rounded-xl border-border/50 button-press group">
                <Shield className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                Configurar Permissões
              </Button>
              <Button variant="outline" className="w-full justify-start hover:bg-muted/50 transition-smooth font-medium py-3 rounded-xl border-border/50 button-press group">
                <FileText className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                Relatórios de Segurança
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start hover:bg-warning/10 transition-smooth text-warning border-warning/30 font-medium py-3 rounded-xl button-press group"
                onClick={() => setIsCleanupModalOpen(true)}
              >
                <Trash2 className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                Limpar Log Antigo
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2 shadow-elegant border-0 bg-card/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-foreground font-bold text-xl tracking-tight">Atividade Recente</CardTitle>
              <CardDescription className="font-medium">
                Últimas ações realizadas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/20 hover:bg-muted/30 transition-smooth border border-border/30"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`h-3 w-3 rounded-full animate-pulse ${
                        activity.type === "access" ? "bg-primary" :
                        activity.type === "create" ? "bg-success" :
                        activity.type === "modify" ? "bg-warning" :
                        "bg-muted-foreground"
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {activity.user}
                        </p>
                        <p className={`text-xs ${getActivityColor(activity.type)}`}>
                          {activity.action}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Status */}
        <Card className="shadow-elegant border-0 bg-gradient-primary text-primary-foreground">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6" />
              <CardTitle className="text-xl font-bold tracking-tight">Status de Segurança</CardTitle>
            </div>
            <CardDescription className="text-primary-foreground/90 font-medium">
              Sistema operando com máxima segurança Aksell
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="text-3xl font-bold tracking-tight">100%</div>
                <div className="text-sm opacity-90 font-medium">Documentos Protegidos</div>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="text-3xl font-bold tracking-tight">0</div>
                <div className="text-sm opacity-90 font-medium">Tentativas de Invasão</div>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="text-3xl font-bold tracking-tight">24/7</div>
                <div className="text-sm opacity-90 font-medium">Monitoramento Ativo</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <AuditLogCleanupModal
        isOpen={isCleanupModalOpen}
        onClose={() => setIsCleanupModalOpen(false)}
        onCleanup={cleanOldLogs}
        currentCount={auditStats.count}
      />
    </div>
  );
};
