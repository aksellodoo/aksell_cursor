import { Users, UserPlus, UserCheck, Clock, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const DashboardUsers = () => {
  const userStats = [
    {
      title: "Total de Usuários",
      value: "24",
      change: "+12%",
      trend: "up",
      icon: Users,
    },
    {
      title: "Usuários Ativos",
      value: "18",
      change: "+5%", 
      trend: "up",
      icon: UserCheck,
    },
    {
      title: "Novos Usuários",
      value: "3",
      change: "+150%",
      trend: "up",
      icon: UserPlus,
    },
    {
      title: "Tempo Médio Online",
      value: "2.4h",
      change: "-8%",
      trend: "down",
      icon: Clock,
    },
  ];

  const recentUsers = [
    { name: "Maria Silva", role: "Nutricionista", status: "online", lastSeen: "Agora" },
    { name: "João Santos", role: "Administrador", status: "online", lastSeen: "5 min atrás" },
    { name: "Ana Costa", role: "Recepcionista", status: "offline", lastSeen: "2h atrás" },
    { name: "Pedro Lima", role: "Nutricionista", status: "away", lastSeen: "1h atrás" },
    { name: "Carla Mendes", role: "Gerente", status: "online", lastSeen: "Agora" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "away": return "bg-yellow-500";
      case "offline": return "bg-gray-400";
      default: return "bg-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online": return "Online";
      case "away": return "Ausente";
      case "offline": return "Offline";
      default: return "Desconhecido";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Usuários</h2>
          <p className="text-muted-foreground font-medium">
            Métricas e análises detalhadas dos usuários do sistema
          </p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground hover:shadow-primary transition-all duration-300 font-semibold px-6 py-3 rounded-xl">
          <UserPlus className="mr-3 h-5 w-5" />
          Novo Usuário
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="flex flex-wrap justify-center gap-6">
        {userStats.map((stat, index) => (
          <Card 
            key={stat.title} 
            className="w-full sm:w-[260px] md:w-[280px] shadow-elegant border-0 bg-card/90 backdrop-blur-sm hover:shadow-glow transition-all duration-300 hover:scale-[1.02] animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1">
                {stat.value}
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className={`h-3 w-3 ${
                  stat.trend === "up" ? "text-green-500" : "text-red-500"
                }`} />
                <span className={`text-xs font-medium ${
                  stat.trend === "up" ? "text-green-500" : "text-red-500"
                }`}>
                  {stat.change}
                </span>
                <span className="text-xs text-muted-foreground">vs mês anterior</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Users */}
        <Card className="shadow-card border-0 bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Usuários Recentes
            </CardTitle>
            <CardDescription>
              Status e atividade dos usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.map((user, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-smooth"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${getStatusColor(user.status)}`} />
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {user.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.role}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={user.status === "online" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {getStatusText(user.status)}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {user.lastSeen}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Activity Chart Placeholder */}
        <Card className="shadow-card border-0 bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Atividade por Hora
            </CardTitle>
            <CardDescription>
              Distribuição de acessos ao longo do dia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted/10 rounded-lg">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Gráfico de atividade
                </p>
                <p className="text-xs text-muted-foreground">
                  Dados em tempo real
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};