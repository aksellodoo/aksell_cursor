import { Shield, Activity, Database, AlertTriangle, Clock, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuditStats } from "@/hooks/useAuditStats";
import { useState } from "react";
import { AuditLogCleanupModal } from "@/components/AuditLogCleanupModal";

export const DashboardAudit = () => {
  const { stats: auditStats, loading: auditLoading, cleanOldLogs } = useAuditStats();
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);

  const securityStats = [
    {
      title: "Total de Logs",
      value: auditLoading ? "..." : auditStats.count.toString(),
      change: `+${auditStats.monthlyGrowth}`,
      trend: "up",
      icon: Database,
    },
    {
      title: "Tamanho do Log",
      value: auditLoading ? "..." : auditStats.sizeFormatted,
      change: "+12%",
      trend: "up", 
      icon: FileText,
    },
    {
      title: "Eventos Críticos",
      value: "0",
      change: "0",
      trend: "stable",
      icon: AlertTriangle,
    },
    {
      title: "Uptime Sistema",
      value: "99.9%",
      change: "+0.1%",
      trend: "up",
      icon: Shield,
    },
  ];

  const recentAuditLogs = [
    {
      user: "Maria Silva",
      action: "Alterou campo 'email' do usuário João Santos",
      table: "usuarios",
      timestamp: "2024-01-15 14:30:25",
      type: "UPDATE",
      severity: "info"
    },
    {
      user: "Admin System",
      action: "Criou novo departamento 'Marketing Digital'",
      table: "departamentos", 
      timestamp: "2024-01-15 14:25:10",
      type: "INSERT",
      severity: "info"
    },
    {
      user: "João Santos",
      action: "Deletou usuário inativo 'Pedro Costa'",
      table: "usuarios",
      timestamp: "2024-01-15 14:20:15", 
      type: "DELETE",
      severity: "warning"
    },
    {
      user: "Ana Costa",
      action: "Modificou permissões do departamento Nutrição",
      table: "departamentos",
      timestamp: "2024-01-15 14:15:30",
      type: "UPDATE", 
      severity: "info"
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-600 bg-red-50 border-red-200";
      case "warning": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "info": return "text-blue-600 bg-blue-50 border-blue-200";
      case "success": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "INSERT": return <TrendingUp className="h-3 w-3 text-green-500" />;
      case "UPDATE": return <Activity className="h-3 w-3 text-blue-500" />;
      case "DELETE": return <AlertTriangle className="h-3 w-3 text-red-500" />;
      default: return <Activity className="h-3 w-3 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Auditoria</h2>
          <p className="text-muted-foreground">
            Logs de segurança e monitoramento do sistema
          </p>
        </div>
        <Button 
          className="bg-gradient-primary text-primary-foreground"
          onClick={() => setIsCleanupModalOpen(true)}
        >
          <Database className="mr-2 h-4 w-4" />
          Gerenciar Logs
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="flex flex-wrap justify-center gap-6">
        {securityStats.map((stat, index) => (
          <Card 
            key={stat.title} 
            className="w-full sm:w-[260px] md:w-[280px] shadow-card border-0 bg-gradient-card hover:shadow-glow transition-all duration-300 hover:scale-[1.02]"
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
                  stat.trend === "up" ? "text-green-500" : 
                  stat.trend === "down" ? "text-red-500" : "text-gray-500"
                }`} />
                <span className={`text-xs font-medium ${
                  stat.trend === "up" ? "text-green-500" : 
                  stat.trend === "down" ? "text-red-500" : "text-gray-500"
                }`}>
                  {stat.change}
                </span>
                <span className="text-xs text-muted-foreground">este mês</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Audit Logs */}
        <Card className="lg:col-span-2 shadow-card border-0 bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Logs Recentes
            </CardTitle>
            <CardDescription>
              Últimas alterações registradas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAuditLogs.map((log, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-smooth border border-border/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTypeIcon(log.type)}
                        <Badge variant="outline" className="text-xs">
                          {log.table}
                        </Badge>
                        <Badge className={getSeverityColor(log.severity)}>
                          {log.severity}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        {log.action}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Por: {log.user}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {log.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Status */}
        <Card className="shadow-card border-0 bg-gradient-security text-primary-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Status de Segurança
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Sistema operando com segurança máxima
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Firewall Ativo</span>
                <Badge className="bg-green-500/20 text-green-100 border-green-500/30">
                  ✓ Online
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Backup Automático</span>
                <Badge className="bg-green-500/20 text-green-100 border-green-500/30">
                  ✓ Ativo
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Monitoramento</span>
                <Badge className="bg-green-500/20 text-green-100 border-green-500/30">
                  ✓ 24/7
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Última Verificação</span>
                <span className="text-xs text-primary-foreground/80">
                  há 2 minutos
                </span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-primary-foreground/20">
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">100%</div>
                <div className="text-sm opacity-80">Sistema Seguro</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AuditLogCleanupModal
        isOpen={isCleanupModalOpen}
        onClose={() => setIsCleanupModalOpen(false)}
        onCleanup={cleanOldLogs}
        currentCount={auditStats.count}
      />
    </div>
  );
};