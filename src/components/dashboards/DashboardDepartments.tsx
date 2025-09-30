import { Building, Users, TrendingUp, Target, PieChart, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const DashboardDepartments = () => {
  const departmentStats = [
    {
      title: "Total Departamentos",
      value: "8",
      change: "+1",
      trend: "up",
      icon: Building,
    },
    {
      title: "Usuários Distribuídos", 
      value: "24",
      change: "+3",
      trend: "up",
      icon: Users,
    },
    {
      title: "Eficiência Média",
      value: "87%",
      change: "+5%",
      trend: "up", 
      icon: Target,
    },
    {
      title: "Ocupação Média",
      value: "75%",
      change: "+12%",
      trend: "up",
      icon: PieChart,
    },
  ];

  const departments = [
    { 
      name: "Nutrição", 
      users: 8, 
      efficiency: 92, 
      status: "excellent",
      description: "Atendimento nutricional",
      lead: "Dr. Maria Silva"
    },
    { 
      name: "Administração", 
      users: 5, 
      efficiency: 88, 
      status: "good",
      description: "Gestão administrativa", 
      lead: "João Santos"
    },
    { 
      name: "Recepção", 
      users: 4, 
      efficiency: 85, 
      status: "good",
      description: "Atendimento inicial",
      lead: "Ana Costa"
    },
    { 
      name: "Financeiro", 
      users: 3, 
      efficiency: 90, 
      status: "excellent",
      description: "Controle financeiro",
      lead: "Carlos Oliveira"
    },
    { 
      name: "Marketing", 
      users: 2, 
      efficiency: 78, 
      status: "average",
      description: "Marketing e comunicação",
      lead: "Luciana Mendes"
    },
    { 
      name: "TI", 
      users: 2, 
      efficiency: 95, 
      status: "excellent",
      description: "Tecnologia da informação",
      lead: "Pedro Lima"
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent": return "text-green-600 bg-green-50 border-green-200";
      case "good": return "text-blue-600 bg-blue-50 border-blue-200";
      case "average": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "poor": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "excellent": return "Excelente";
      case "good": return "Bom"; 
      case "average": return "Regular";
      case "poor": return "Precisa Melhorar";
      default: return "N/A";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Departamentos</h2>
          <p className="text-muted-foreground font-medium">
            Análise organizacional e performance por departamento
          </p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground hover:shadow-primary transition-all duration-300 font-semibold px-6 py-3 rounded-xl">
          <Building className="mr-3 h-5 w-5" />
          Novo Departamento
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="flex flex-wrap justify-center gap-6">
        {departmentStats.map((stat, index) => (
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
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs font-medium text-green-500">
                  {stat.change}
                </span>
                <span className="text-xs text-muted-foreground">vs mês anterior</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Departments Grid */}
      <Card className="shadow-card border-0 bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Performance por Departamento
          </CardTitle>
          <CardDescription>
            Eficiência e distribuição de usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept, index) => (
              <Card 
                key={dept.name}
                className="border bg-muted/20 hover:bg-muted/30 transition-smooth"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{dept.name}</CardTitle>
                    <Badge className={getStatusColor(dept.status)}>
                      {getStatusText(dept.status)}
                    </Badge>
                  </div>
                  <CardDescription>{dept.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Usuários:</span>
                    <span className="font-medium">{dept.users}</span>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Eficiência:</span>
                      <span className="font-medium">{dept.efficiency}%</span>
                    </div>
                    <Progress 
                      value={dept.efficiency} 
                      className="h-2"
                    />
                  </div>

                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {dept.lead.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          {dept.lead}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Responsável
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};