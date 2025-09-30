import { useMemo } from 'react';
import { CheckSquare, Clock, AlertTriangle, TrendingUp, User, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const COLORS = {
  'pending': '#f59e0b',
  'in_progress': '#3b82f6', 
  'completed': '#10b981',
  'cancelled': '#ef4444'
};

const PRIORITY_COLORS = {
  'low': '#10b981',
  'medium': '#f59e0b',
  'high': '#ef4444',
  'urgent': '#dc2626'
};

export const DashboardTasks = () => {
  const { tasks, loading } = useTasks();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();

  const analytics = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return {
        statusDistribution: [],
        priorityDistribution: [],
        tasksByAssignee: [],
        overdueCount: 0,
        completionRate: 0,
        totalTasks: 0,
        completedTasks: 0,
        userTasks: 0,
        departmentTasks: 0
      };
    }

    // Filter tasks for current user and department
    const userTasks = tasks.filter(task => 
      task.assigned_to === user?.id || 
      task.created_by === user?.id
    );

    const personalTasks = tasks.filter(task => 
      task.assigned_to === user?.id || task.created_by === user?.id
    );

    const departmentTasks = tasks.filter(task => 
      task.assigned_to === user?.id || task.created_by === user?.id
    );

    // Status distribution
    const statusCounts = userTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      name: status === 'pending' ? 'Pendente' :
            status === 'in_progress' ? 'Em Andamento' :
            status === 'completed' ? 'Concluída' : 'Cancelada',
      value: count,
      fill: COLORS[status as keyof typeof COLORS]
    }));

    // Priority distribution
    const priorityCounts = userTasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const priorityDistribution = Object.entries(priorityCounts).map(([priority, count]) => ({
      name: priority === 'low' ? 'Baixa' :
            priority === 'medium' ? 'Média' :
            priority === 'high' ? 'Alta' : 'Urgente',
      value: count,
      fill: PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS]
    }));

    // Tasks by assignee (top 5)
    const assigneeCounts = userTasks.reduce((acc, task) => {
      if (task.assigned_to) {
        const name = 'Usuário Atribuído';
        acc[name] = (acc[name] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const tasksByAssignee = Object.entries(assigneeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, tasks: count }));

    // Overdue tasks
    const now = new Date();
    const overdueCount = userTasks.filter(task => 
      task.due_date && 
      new Date(task.due_date) < now && 
      task.status !== 'completed'
    ).length;

    // Completion rate
    const completedTasks = userTasks.filter(task => task.status === 'completed').length;
    const completionRate = userTasks.length > 0 ? Math.round((completedTasks / userTasks.length) * 100) : 0;

    return {
      statusDistribution,
      priorityDistribution,
      tasksByAssignee,
      overdueCount,
      completionRate,
      totalTasks: userTasks.length,
      completedTasks,
      userTasks: personalTasks.length,
      departmentTasks: departmentTasks.length
    };
  }, [tasks, user?.id, profile?.department_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  const taskStats = [
    {
      title: "Total de Tarefas",
      value: analytics.totalTasks.toString(),
      description: "Suas tarefas e do departamento",
      icon: CheckSquare,
      trend: analytics.userTasks > 0 ? `${analytics.userTasks} pessoais` : "Nenhuma pessoal"
    },
    {
      title: "Taxa de Conclusão",
      value: `${analytics.completionRate}%`,
      description: "Tarefas concluídas",
      icon: TrendingUp,
      trend: `${analytics.completedTasks} concluídas`
    },
    {
      title: "Tarefas Atrasadas",
      value: analytics.overdueCount.toString(),
      description: "Precisam de atenção",
      icon: AlertTriangle,
      trend: analytics.overdueCount > 0 ? "Ação necessária" : "Em dia"
    },
    {
      title: "Departamento",
      value: analytics.departmentTasks.toString(),
      description: "Tarefas do seu departamento",
      icon: User,
      trend: profile?.department || "Sem departamento"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Tarefas</h2>
          <p className="text-muted-foreground font-medium">
            Análise das suas tarefas e do departamento
          </p>
        </div>
        <Button 
          className="bg-gradient-primary text-primary-foreground hover:shadow-primary transition-all duration-300 font-semibold px-6 py-3 rounded-xl"
          onClick={() => navigate('/tasks/new?origin=fixed')}
        >
          <CheckSquare className="mr-3 h-5 w-5" />
          Nova Tarefa
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="flex flex-wrap justify-center gap-6">
        {taskStats.map((stat, index) => (
          <Card 
            key={stat.title} 
            className="w-full sm:w-[260px] md:w-[280px] shadow-elegant border-0 bg-card/90 backdrop-blur-sm hover:shadow-glow transition-all duration-300 hover:scale-[1.02] animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground tracking-tight">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${
                stat.title === "Tarefas Atrasadas" && analytics.overdueCount > 0 
                  ? "text-red-500" 
                  : "text-primary"
              }`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-2 tracking-tight">
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                {stat.description}
              </p>
              <p className={`text-xs font-semibold ${
                stat.title === "Tarefas Atrasadas" && analytics.overdueCount > 0 
                  ? "text-red-500" 
                  : "text-primary"
              }`}>
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="shadow-elegant border-0 bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Distribuição por Status
            </CardTitle>
            <CardDescription>
              Status das suas tarefas e do departamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analytics.statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Nenhuma tarefa encontrada
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card className="shadow-elegant border-0 bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Distribuição por Prioridade
            </CardTitle>
            <CardDescription>
              Prioridade das tarefas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.priorityDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.priorityDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Nenhuma tarefa encontrada
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Assignees */}
      {analytics.tasksByAssignee.length > 0 && (
        <Card className="shadow-elegant border-0 bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Top 5 Responsáveis
            </CardTitle>
            <CardDescription>
              Usuários com mais tarefas atribuídas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.tasksByAssignee} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="tasks" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};